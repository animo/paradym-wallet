import type { DifPresentationExchangeDefinitionV2, P256Jwk } from '@credo-ts/core'
import type { PlaintextMessage } from '@credo-ts/core/build/types'
import type {
  ConnectionRecord,
  CredentialStateChangedEvent,
  OutOfBandInvitation,
  OutOfBandRecord,
  ProofStateChangedEvent,
} from '@credo-ts/didcomm'
import type {
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciDpopRequestOptions,
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciResolvedCredentialOffer,
  OpenId4VpResolvedAuthorizationRequest,
} from '@credo-ts/openid4vc'
import { getOid4vcCallbacks } from '@credo-ts/openid4vc/build/shared/callbacks'
import type { ParadymAppAgent } from '../agent'
import type { EitherAgent } from '../agent'

import { V1OfferCredentialMessage, V1RequestPresentationMessage } from '@credo-ts/anoncreds'
import { JwaSignatureAlgorithm, Jwt, X509Certificate, X509ModuleConfig } from '@credo-ts/core'
import {
  CredentialEventTypes,
  CredentialState,
  OutOfBandRepository,
  ProofEventTypes,
  ProofState,
  V2OfferCredentialMessage,
  V2RequestPresentationMessage,
  parseMessageType,
} from '@credo-ts/didcomm'
import { supportsIncomingMessageType } from '@credo-ts/didcomm/build/util/messageType'
import {
  getOfferedCredentials,
  getScopesFromCredentialConfigurationsSupported,
  preAuthorizedCodeGrantIdentifier,
} from '@credo-ts/openid4vc'
import { filter, first, firstValueFrom, merge, timeout } from 'rxjs'

import { Oauth2Client, getAuthorizationServerMetadataFromList } from '@openid4vc/oauth2'
import q from 'query-string'
import { credentialRecordFromCredential, encodeCredential } from '../format/credentialEncoding'
import {
  type FormattedSubmission,
  formatDcqlCredentialsForRequest,
  formatDifPexCredentialsForRequest,
} from '../format/formatPresentation'
import { setBatchCredentialMetadata } from '../openid4vc/batchMetadata'
import { getCredentialBindingResolver } from '../openid4vc/credentialBindingResolver'
import { extractOpenId4VcCredentialMetadata, setOpenId4VcCredentialMetadata } from '../openid4vc/displayMetadata'
import { BiometricAuthenticationError } from './error'
import { fetchInvitationDataUrl } from './fetchInvitation'
import type { TrustedEntity } from './trustedEntities'

export async function resolveOpenId4VciOffer({
  agent,
  offer,
  authorization,
  customHeaders,
  fetchAuthorization = true,
}: {
  agent: EitherAgent
  offer: { data?: string; uri?: string }
  authorization?: { clientId: string; redirectUri: string }
  customHeaders?: Record<string, unknown>
  fetchAuthorization?: boolean
}) {
  let offerUri = offer.uri

  if (!offerUri && offer.data) {
    // FIXME: Credo only support credential offer string, but we already parsed it before. So we construct an offer here
    // but in the future we need to support the parsed offer in Credo directly
    offerUri = `openid-credential-offer://credential_offer=${encodeURIComponent(JSON.stringify(offer.data))}`
  } else if (!offerUri) {
    throw new Error('either data or uri must be provided')
  }

  agent.config.logger.info(`Receiving openid uri ${offerUri}`, {
    offerUri,
    data: offer.data,
    uri: offer.uri,
  })

  const resolvedCredentialOffer = await agent.modules.openId4VcHolder.resolveCredentialOffer(offerUri)
  let resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest | undefined = undefined

  // NOTE: we always assume scopes are used at the moment
  if (fetchAuthorization && resolvedCredentialOffer.credentialOfferPayload.grants?.authorization_code) {
    // If only authorization_code grant is valid and user didn't provide authorization details we can't continue
    if (!resolvedCredentialOffer.credentialOfferPayload.grants[preAuthorizedCodeGrantIdentifier] && !authorization) {
      throw new Error(
        "Missing 'authorization' parameter with 'clientId' and 'redirectUri' and authorization code flow is only allowed grant type on offer."
      )
    }

    // TODO: authorization should only be initiated after we know which credentials we're going to request
    if (authorization) {
      resolvedAuthorizationRequest = await agent.modules.openId4VcHolder.resolveOpenId4VciAuthorizationRequest(
        resolvedCredentialOffer,
        {
          redirectUri: authorization.redirectUri,
          clientId: authorization.clientId,
          scope: getScopesFromCredentialConfigurationsSupported(
            resolvedCredentialOffer.offeredCredentialConfigurations
          ),
          // Added in patch but not in types
          // @ts-ignore
          customHeaders,
        }
      )
    }
  }

  return {
    resolvedCredentialOffer,
    resolvedAuthorizationRequest,
  }
}

export async function acquirePreAuthorizedAccessToken({
  agent,
  resolvedCredentialOffer,
  txCode,
}: {
  agent: EitherAgent
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  txCode?: string
}) {
  return await agent.modules.openId4VcHolder.requestToken({
    resolvedCredentialOffer,
    txCode,
  })
}

export async function acquireAuthorizationCodeUsingPresentation({
  resolvedCredentialOffer,
  agent,
  authSession,
  presentationDuringIssuanceSession,
  dPopKeyJwk,
}: {
  agent: EitherAgent
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  dPopKeyJwk?: P256Jwk
  authSession: string
  presentationDuringIssuanceSession?: string
}) {
  return await agent.modules.openId4VcHolder.retrieveAuthorizationCodeUsingPresentation({
    authSession,
    dpop: dPopKeyJwk
      ? {
          alg: dPopKeyJwk.supportedSignatureAlgorithms[0],
          jwk: dPopKeyJwk,
        }
      : undefined,
    resolvedCredentialOffer,
    presentationDuringIssuanceSession,
  })
}

export async function acquireRefreshTokenAccessToken({
  authorizationServer,
  resolvedCredentialOffer,
  agent,
  clientId,
  refreshToken,
  dpop,
}: {
  agent: EitherAgent
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  authorizationServer: string
  clientId: string
  refreshToken: string
  dpop?: OpenId4VciDpopRequestOptions
}): Promise<OpenId4VciRequestTokenResponse> {
  const oauth2Client = new Oauth2Client({ callbacks: getOid4vcCallbacks(agent.context) })

  // TODO: dpop retry also for this method
  const accessTokenResponse = await oauth2Client.retrieveRefreshTokenAccessToken({
    refreshToken,
    resource: resolvedCredentialOffer.credentialOfferPayload.credential_issuer,
    authorizationServerMetadata: getAuthorizationServerMetadataFromList(
      resolvedCredentialOffer.metadata.authorizationServers,
      authorizationServer
    ),
    additionalRequestPayload: {
      client_id: clientId,
    },
    dpop: dpop
      ? {
          nonce: dpop.nonce,
          signer: {
            method: 'jwk',
            alg: dpop.alg,
            publicJwk: dpop.jwk.toJson(),
          },
        }
      : undefined,
  })

  return {
    accessToken: accessTokenResponse.accessTokenResponse.access_token,
    cNonce: accessTokenResponse.accessTokenResponse.c_nonce,
    dpop: dpop ? { ...dpop, nonce: accessTokenResponse.dpop?.nonce } : undefined,
    accessTokenResponse: accessTokenResponse.accessTokenResponse,
  }
}

export async function acquireAuthorizationCodeAccessToken({
  resolvedCredentialOffer,
  agent,
  codeVerifier,
  authorizationCode,
  clientId,
  redirectUri,
}: {
  agent: EitherAgent
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  codeVerifier?: string
  authorizationCode: string
  clientId: string
  redirectUri?: string
}) {
  return await agent.modules.openId4VcHolder.requestToken({
    resolvedCredentialOffer,
    code: authorizationCode,
    codeVerifier,
    redirectUri,
    clientId,
  })
}

export const receiveCredentialFromOpenId4VciOffer = async ({
  agent,
  resolvedCredentialOffer,
  credentialConfigurationIdsToRequest,
  accessToken,
  clientId,
  pidSchemes,
  requestBatch,
}: {
  agent: EitherAgent
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  credentialConfigurationIdsToRequest?: string[]
  clientId?: string
  pidSchemes?: { sdJwtVcVcts: Array<string>; msoMdocDoctypes: Array<string> }
  requestBatch?: boolean | number

  // TODO: cNonce should maybe be provided separately (multiple calls can have different c_nonce values)
  accessToken: OpenId4VciRequestTokenResponse
}) => {
  const offeredCredentialsToRequest = getOfferedCredentials(
    credentialConfigurationIdsToRequest ?? [
      resolvedCredentialOffer.credentialOfferPayload.credential_configuration_ids[0],
    ],
    resolvedCredentialOffer.offeredCredentialConfigurations
  ) as OpenId4VciCredentialConfigurationSupportedWithFormats

  if (Object.keys(offeredCredentialsToRequest).length === 0) {
    throw new Error(
      `Parameter 'credentialConfigurationIdsToRequest' with values ${credentialConfigurationIdsToRequest} is not a credential_configuration_id in the credential offer.`
    )
  }

  try {
    const credentials = await agent.modules.openId4VcHolder.requestCredentials({
      resolvedCredentialOffer,
      ...accessToken,
      clientId,
      credentialConfigurationIds: Object.keys(offeredCredentialsToRequest),
      verifyCredentialStatus: false,
      requestBatch,
      allowedProofOfPossessionSignatureAlgorithms: [
        // NOTE: MATTR launchpad for JFF MUST use EdDSA. So it is important that the default (first allowed one)
        // is EdDSA. The list is ordered by preference, so if no suites are defined by the issuer, the first one
        // will be used
        JwaSignatureAlgorithm.EdDSA,
        JwaSignatureAlgorithm.ES256,
      ],
      credentialBindingResolver: getCredentialBindingResolver({
        pidSchemes,
        resolvedCredentialOffer,
      }),
    })

    return credentials.credentials.map(({ credentials, ...credentialResponse }) => {
      const configuration = resolvedCredentialOffer.offeredCredentialConfigurations[
        credentialResponse.credentialConfigurationId
      ] as OpenId4VciCredentialConfigurationSupportedWithFormats

      const firstCredential = credentials[0]
      const record = credentialRecordFromCredential(firstCredential)

      // OpenID4VC metadata
      const openId4VcMetadata = extractOpenId4VcCredentialMetadata(configuration, {
        id: resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
        display: resolvedCredentialOffer.metadata.credentialIssuer.display,
      })
      setOpenId4VcCredentialMetadata(record, openId4VcMetadata)

      // Match metadata
      if (credentials.length > 1) {
        setBatchCredentialMetadata(record, {
          additionalCredentials: credentials.slice(1).map(encodeCredential) as
            | Array<string>
            | Array<Record<string, unknown>>,
        })
      }

      return {
        ...credentialResponse,
        configuration,
        credential: record,
      }
    })
  } catch (error) {
    // TODO: if one biometric operation fails it will fail the whole credential receiving. We should have more control so we
    // can retry e.g. the second credential
    // Handle biometric authentication errors
    throw BiometricAuthenticationError.tryParseFromError(error) ?? error
  }
}

const extractEntityIdFromJwt = (jwt: string): string | null => {
  const jwtPayload = Jwt.fromSerializedJwt(jwt).payload

  if (jwtPayload?.additionalClaims?.client_id_scheme !== 'entity_id') return null

  const clientId = jwtPayload?.additionalClaims?.client_id
  if (!clientId || typeof clientId !== 'string') return null

  return clientId
}

/**
 * This is a temp method to allow for untrusted certificates to still work with the wallet.
 */
export const extractEntityIdFromAuthorizationRequest = async ({
  data,
  uri,
}: { data?: string; uri?: string }): Promise<{ data: string | null; entityId: string | null }> => {
  try {
    if (data) {
      return {
        data,
        entityId: extractEntityIdFromJwt(data),
      }
    }

    if (uri) {
      const query = q.parseUrl(uri).query
      if (query.request_uri && typeof query.request_uri === 'string') {
        const result = await fetchInvitationDataUrl(query.request_uri)

        if (
          result.success &&
          result.result.type === 'openid-authorization-request' &&
          typeof result.result.data === 'string'
        ) {
          return {
            data: result.result.data,
            entityId: extractEntityIdFromJwt(result.result.data),
          }
        }
      } else if (query.request && typeof query.request === 'string') {
        return {
          data: query.request,
          entityId: extractEntityIdFromJwt(query.request),
        }
      }
    }
  } catch (error) {
    console.error(error)
  }

  return { data: null, entityId: null }
}

export type CredentialsForProofRequest = Awaited<ReturnType<typeof getCredentialsForProofRequest>>

export type GetCredentialsForProofRequestOptions = {
  agent: EitherAgent
  encodedRequestData?: string
  requestPayload?: Record<string, unknown>
  uri?: string
  allowUntrustedFederation?: boolean
  origin?: string
  trustedX509Entities?: TrustedX509Entity[]
}

export const getCredentialsForProofRequest = async ({
  agent,
  encodedRequestData,
  uri,
  requestPayload,
  allowUntrustedFederation = true,
  origin,
  trustedX509Entities,
}: GetCredentialsForProofRequestOptions) => {
  const requestData = encodedRequestData
  // const { entityId = undefined, data: fromFederationData = null } = allowUntrustedFederation
  //   ? await extractEntityIdFromAuthorizationRequest({ data: requestData, uri })
  //   : {}
  // requestData = fromFederationData ?? requestData

  let request: string | Record<string, unknown>

  if (requestData) {
    // FIXME: Credo only support request string, but we already parsed it before. So we construct an request here
    // but in the future we need to support the parsed request in Credo directly
    request = `openid://?request=${encodeURIComponent(requestData)}`
  } else if (uri) {
    request = uri
  } else if (requestPayload) {
    request = requestPayload
  } else {
    throw new Error('Either data or uri must be provided')
  }

  agent.config.logger.info('Receiving openid request', {
    request,
  })

  const resolved = await agent.modules.openId4VcHolder.resolveOpenId4VpAuthorizationRequest(
    request,
    { origin }
    /* {
    ...(entityId ? { federation: { trustedEntityIds: [entityId] } } : {}),
  } */
  )

  const { trustedEntities, verifier } = await getTrustedEntitiesForRequest({
    agent,
    resolvedAuthorizationRequest: resolved,
    trustedX509Entities,
  })

  let formattedSubmission: FormattedSubmission
  if (resolved.presentationExchange) {
    formattedSubmission = formatDifPexCredentialsForRequest(
      resolved.presentationExchange.credentialsForRequest,
      resolved.presentationExchange.definition as DifPresentationExchangeDefinitionV2
    )
  } else if (resolved.dcql) {
    formattedSubmission = formatDcqlCredentialsForRequest(resolved.dcql.queryResult)
  } else {
    throw new Error('No presentation exchange or dcql found in authorization request.')
  }

  return {
    ...resolved.presentationExchange,
    ...resolved.dcql,
    // FIXME: origin should be part of resolved from Credo, as it's also needed
    // in the accept method now, which wouldn't be the case if we just add it to
    // the resolved version
    origin,
    authorizationRequest: resolved.authorizationRequestPayload,
    verifier: {
      hostName: verifier.uri,
      entityId: verifier.entity_id /* entityId ?? */,

      logo: verifier.logo_uri
        ? {
            url: verifier.logo_uri,
          }
        : undefined,
      name: verifier.organization_name,
      trustedEntities,
    },
    formattedSubmission,
    transactionData: resolved.transactionData,
  } as const
}

/**
 * @todo we probably need a way to cancel this method, if the qr scanner is .e.g dismissed.
 */
export async function receiveOutOfBandInvitation(
  agent: ParadymAppAgent,
  invitation: OutOfBandInvitation
): Promise<
  | { success: true; id: string; type: 'credentialExchange' }
  | { success: true; id: string; type: 'proofExchange' }
  | { success: false; error: string }
> {
  const requestMessages = invitation.getRequests() ?? []

  if (requestMessages.length > 1) {
    const message = 'Message contains multiple requests. Invitation should only contain a single request.'
    agent.config.logger.error(message)
    return {
      success: false,
      error: message,
    }
  }

  // In this case we probably need to create a connection first. We will do this here, as we don't allow to just
  // create a connection
  if (requestMessages.length === 0) {
    if (!invitation.handshakeProtocols || invitation.handshakeProtocols.length === 0) {
      agent.config.logger.error('No requests and no handshake protocols found in invitation.')
      return {
        success: false,
        error: 'Invalid invitation.',
      }
    }
  }
  // Validate the type of the request message
  else {
    const requestMessage = requestMessages[0] as PlaintextMessage
    const parsedMessageType = parseMessageType(requestMessage['@type'])
    const isValidRequestMessage =
      supportsIncomingMessageType(parsedMessageType, V1OfferCredentialMessage.type) ||
      supportsIncomingMessageType(parsedMessageType, V2OfferCredentialMessage.type) ||
      supportsIncomingMessageType(parsedMessageType, V1RequestPresentationMessage.type) ||
      supportsIncomingMessageType(parsedMessageType, V2RequestPresentationMessage.type)

    if (!isValidRequestMessage) {
      agent.config.logger.error('Message request is not from supported protocol.')
      return {
        success: false,
        error: 'Invalid invitation.',
      }
    }
  }

  // The value is reassigned, but eslint doesn't know this.
  // eslint-disable-next-line prefer-const
  let connectionId: string | undefined

  const credentialOffer = agent.events
    .observable<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged)
    .pipe(
      filter((event) => event.payload.credentialRecord.state === CredentialState.OfferReceived),
      filter((event) => event.payload.credentialRecord.connectionId === connectionId)
    )

  const proofRequest = agent.events.observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged).pipe(
    filter((event) => event.payload.proofRecord.state === ProofState.RequestReceived),
    filter((event) => event.payload.proofRecord.connectionId === connectionId)
  )

  const eventPromise = firstValueFrom(
    merge(credentialOffer, proofRequest).pipe(
      first(),
      // We allow 15 seconds to receive a credential offer or proof request
      timeout(15 * 1000)
    )
  )

  let connectionRecord: ConnectionRecord | undefined
  let outOfBandRecord: OutOfBandRecord

  try {
    // Check if invitation already exists
    const receivedInvite = await agent.modules.outOfBand.findByReceivedInvitationId(invitation.id)
    if (receivedInvite) {
      return {
        success: false,
        error: 'Invitation has already been scanned.',
      }
    }

    const receiveInvitationResult = await agent.modules.outOfBand.receiveInvitation(invitation, {
      reuseConnection: true,
    })
    connectionRecord = receiveInvitationResult.connectionRecord
    outOfBandRecord = receiveInvitationResult.outOfBandRecord

    // Assign connectionId so it can be used in the observables.
    connectionId = connectionRecord?.id
  } catch (error) {
    agent.config.logger.error(`Error while receiving invitation: ${error as string}`)

    return {
      success: false,
      error: 'Invalid invitation.',
    }
  }

  try {
    const event = await eventPromise
    agent.config.logger.debug(`Received event ${event.type}`)

    if (event.type === CredentialEventTypes.CredentialStateChanged) {
      return {
        success: true,
        id: event.payload.credentialRecord.id,
        type: 'credentialExchange',
      }
    }
    if (event.type === ProofEventTypes.ProofStateChanged) {
      return {
        success: true,
        id: event.payload.proofRecord.id,
        type: 'proofExchange',
      }
    }
  } catch (error) {
    agent.config.logger.error(
      'Error while waiting for credential offer or proof request. Deleting connection and records'
    )
    // Delete OOB record
    const outOfBandRepository = agent.dependencyManager.resolve(OutOfBandRepository)
    await outOfBandRepository.deleteById(agent.context, outOfBandRecord.id)

    // Delete connection record
    // TODO: delete did and mediation stuff
    if (connectionRecord) {
      await agent.modules.connections.deleteById(connectionRecord.id)
    }

    return {
      success: false,
      error: 'Invalid invitation.',
    }
  }

  return {
    success: false,
    error: 'Invalid invitation.',
  }
}

export type TrustedX509Entity = { certificate: string; name: string; logoUri: string; url: string }
async function getTrustedEntitiesForRequest({
  agent,
  resolvedAuthorizationRequest,
  trustedX509Entities,
}: {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  trustedX509Entities?: TrustedX509Entity[]
  agent: EitherAgent
}) {
  const { authorizationRequestPayload, signedAuthorizationRequest, origin } = resolvedAuthorizationRequest

  const trustedEntities: TrustedEntity[] = []
  const clientMetadata = authorizationRequestPayload.client_metadata
  const verifier = {
    entity_id: authorizationRequestPayload.client_id ?? `web-origin:${origin}`,
    uri:
      typeof authorizationRequestPayload.response_uri === 'string'
        ? new URL(authorizationRequestPayload.response_uri).origin
        : undefined,
    logo_uri: clientMetadata?.logo_uri,
    organization_name: clientMetadata?.client_name,
  }

  // if (entityId) {
  //   // TODO: Remove me when the new credo-ts version is used
  //   if (resolved.authorizationRequest.payload) {
  //     resolved.authorizationRequest.payload.client_metadata =
  //       resolved.authorizationRequest.authorizationRequestPayload.client_metadata
  //   }

  //   const resolvedChains = await agent.modules.openId4VcHolder.resolveOpenIdFederationChains({
  //     entityId: entityId,
  //     trustAnchorEntityIds: TRUSTED_ENTITIES,
  //   })

  //   trustedEntities = resolvedChains
  //     .map((chain) => ({
  //       entity_id: chain.trustAnchorEntityConfiguration.sub,
  //       organization_name:
  //         chain.trustAnchorEntityConfiguration.metadata?.federation_entity?.organization_name ?? 'Unknown entity',
  //       logo_uri: chain.trustAnchorEntityConfiguration.metadata?.federation_entity?.logo_uri,
  //     }))
  //     .filter((entity, index, self) => self.findIndex((e) => e.entity_id === entity.entity_id) === index)
  // }

  const signer = signedAuthorizationRequest?.signer
  if (signer?.method === 'x5c') {
    const x509Config = agent.dependencyManager.resolve(X509ModuleConfig)

    try {
      // FIXME: we should return the x509 cert that was matched, then we can just see if it's in
      // the list of hardcoded trusted certificates
      const chain = await agent.x509.validateCertificateChain({
        certificateChain: signer.x5c,
        certificate: signer.x5c[0],
        trustedCertificates: x509Config.trustedCertificates,
      })

      const trustedEntity = trustedX509Entities?.find((e) =>
        X509Certificate.fromEncodedCertificate(e.certificate).equal(chain[0])
      )
      if (trustedEntity) {
        if (!verifier.organization_name) {
          verifier.organization_name = trustedEntity.name
          verifier.logo_uri = trustedEntity.logoUri
        } else {
          // If the certificate chain validates and doesn't throw we know it's a trusted certificate based on the hardcoded certificates
          trustedEntities.push({
            entity_id: trustedEntity.certificate,
            organization_name: trustedEntity.name,
            logo_uri: trustedEntity.logoUri,
            uri: trustedEntity.url,
          })
        }

        // If the certificate chain validates and doesn't throw we know it's a trusted certificate based on the hardcoded certificates
        trustedEntities.push({
          ...verifier,
          organization_name: verifier.organization_name ?? trustedEntity.name,
        })

        // TODO: dynamic paradym or funke wallet
        trustedEntities.push({
          organization_name: 'Paradym Wallet',
          entity_id: 'https://paradym.id',
          logo_uri: require('../../../../apps/easypid/assets/paradym/icon.png'),
          uri: 'https://paradym.id',
        })
      }
    } catch (error) {
      // no-op
    }
  }

  return {
    verifier,
    trustedEntities,
  }
}
