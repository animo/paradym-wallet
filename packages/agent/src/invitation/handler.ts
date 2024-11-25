import type {
  ConnectionRecord,
  CredentialStateChangedEvent,
  DifPresentationExchangeDefinitionV2,
  OutOfBandInvitation,
  OutOfBandRecord,
  P256Jwk,
  ProofStateChangedEvent,
} from '@credo-ts/core'
import type { PlaintextMessage } from '@credo-ts/core/build/types'
import type {
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciDpopRequestOptions,
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'
import { getOid4vciCallbacks } from '@credo-ts/openid4vc/build/shared/callbacks'
import { Linking } from 'react-native'
import type { EitherAgent, FullAppAgent } from '../agent'

import { V1OfferCredentialMessage, V1RequestPresentationMessage } from '@credo-ts/anoncreds'
import {
  CredentialEventTypes,
  CredentialState,
  JwaSignatureAlgorithm,
  Jwt,
  OutOfBandRepository,
  ProofEventTypes,
  ProofState,
  V2OfferCredentialMessage,
  V2RequestPresentationMessage,
  X509ModuleConfig,
  parseMessageType,
} from '@credo-ts/core'
import { supportsIncomingMessageType } from '@credo-ts/core/build/utils/messageType'
import {
  getOfferedCredentials,
  getScopesFromCredentialConfigurationsSupported,
  preAuthorizedCodeGrantIdentifier,
} from '@credo-ts/openid4vc'
import { getHostNameFromUrl } from '@package/utils'
import { filter, first, firstValueFrom, merge, timeout } from 'rxjs'

import { Oauth2Client, getAuthorizationServerMetadataFromList } from '@animo-id/oauth2'
import q from 'query-string'
import { handleBatchCredential } from '../batch'
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
      resolvedAuthorizationRequest = await agent.modules.openId4VcHolder.resolveIssuanceAuthorizationRequest(
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
  const oauth2Client = new Oauth2Client({ callbacks: getOid4vciCallbacks(agent.context) })

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

const extractCertificateFromJwt = (jwt: string) => {
  const jwtHeader = Jwt.fromSerializedJwt(jwt).header
  return Array.isArray(jwtHeader.x5c) && typeof jwtHeader.x5c[0] === 'string' ? jwtHeader.x5c[0] : null
}

/**
 * This is a temp method to allow for untrusted certificates to still work with the wallet.
 */
export const extractCertificateFromAuthorizationRequest = async ({
  data,
  uri,
}: { data?: string; uri?: string }): Promise<{ data: string | null; certificate: string | null }> => {
  try {
    if (data) {
      return {
        data,
        certificate: extractCertificateFromJwt(data),
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
            certificate: extractCertificateFromJwt(result.result.data),
          }
        }
      } else if (query.request && typeof query.request === 'string') {
        return {
          data: query.request,
          certificate: extractCertificateFromJwt(query.request),
        }
      }
    }

    return { data: null, certificate: null }
  } catch (error) {
    return { data: null, certificate: null }
  }
}

export async function withTrustedCertificate<T>(
  agent: EitherAgent,
  certificate: string | null,
  method: () => Promise<T> | T
): Promise<T> {
  const x509ModuleConfig = agent.dependencyManager.resolve(X509ModuleConfig)
  const currentTrustedCertificates = x509ModuleConfig.trustedCertificates
    ? [...x509ModuleConfig.trustedCertificates]
    : []

  try {
    if (certificate) agent.x509.addTrustedCertificate(certificate)
    return await method()
  } finally {
    if (certificate) x509ModuleConfig.setTrustedCertificates(currentTrustedCertificates as [string])
  }
}

export type CredentialsForProofRequest = Awaited<ReturnType<typeof getCredentialsForProofRequest>>
export const getCredentialsForProofRequest = async ({
  agent,
  data,
  uri,
  allowUntrustedCertificates = false,
}: {
  agent: EitherAgent
  // Either data or uri can be provided
  data?: string
  uri?: string
  allowUntrustedCertificates?: boolean
}) => {
  let requestUri: string

  const { certificate = null, data: newData = null } = allowUntrustedCertificates
    ? await extractCertificateFromAuthorizationRequest({ data, uri })
    : {}

  if (newData) {
    // FIXME: Credo only support request string, but we already parsed it before. So we construct an request here
    // but in the future we need to support the parsed request in Credo directly
    requestUri = `openid://?request=${encodeURIComponent(newData)}`
  } else if (data) {
    // FIXME: Credo only support request string, but we already parsed it before. So we construct an request here
    // but in the future we need to support the parsed request in Credo directly
    requestUri = `openid://?request=${encodeURIComponent(data)}`
  } else if (uri) {
    requestUri = uri
  } else {
    throw new Error('Either data or uri must be provided')
  }

  agent.config.logger.info(`Receiving openid uri ${requestUri}`, {
    data,
    uri,
    requestUri,
  })

  // Temp solution to add and remove the trusted certificate
  const resolved = await withTrustedCertificate(agent, certificate, () =>
    agent.modules.openId4VcHolder.resolveSiopAuthorizationRequest(requestUri)
  )

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

  const clientMetadata = resolved.authorizationRequest.payload?.client_metadata as
    | {
        client_name?: string
        logo_uri?: string
      }
    | undefined

  return {
    ...resolved.presentationExchange,
    ...resolved.dcql,
    authorizationRequest: resolved.authorizationRequest,
    verifier: {
      hostName: resolved.authorizationRequest.responseURI
        ? getHostNameFromUrl(resolved.authorizationRequest.responseURI)
        : undefined,
      entityId: resolved.authorizationRequest.payload?.iss as string,

      logo: {
        url: clientMetadata?.logo_uri,
      },
      name: clientMetadata?.client_name,
    },
    formattedSubmission,
  } as const
}

export const shareProof = async ({
  agent,
  resolvedRequest,
  selectedCredentials,
  allowUntrustedCertificate = false,
}: {
  agent: EitherAgent
  resolvedRequest: CredentialsForProofRequest
  selectedCredentials: { [inputDescriptorId: string]: string }
  allowUntrustedCertificate?: boolean
}) => {
  const { authorizationRequest } = resolvedRequest
  if (
    !resolvedRequest.credentialsForRequest?.areRequirementsSatisfied &&
    !resolvedRequest.queryResult?.canBeSatisfied
  ) {
    throw new Error('Requirements from proof request are not satisfied')
  }

  // Map all requirements and entries to a credential record. If a credential record for an
  // input descriptor has been provided in `selectedCredentials` we will use that. Otherwise
  // it will pick the first available credential.
  const presentationExchangeCredentials = resolvedRequest.credentialsForRequest
    ? Object.fromEntries(
        await Promise.all(
          resolvedRequest.credentialsForRequest.requirements.flatMap((requirement) =>
            requirement.submissionEntry.slice(0, requirement.needsCount).map(async (entry) => {
              const credentialId = selectedCredentials[entry.inputDescriptorId]
              const credential =
                entry.verifiableCredentials.find((vc) => vc.credentialRecord.id === credentialId) ??
                entry.verifiableCredentials[0]

              // Optionally use a batch credential
              const credentialRecord = await handleBatchCredential(agent, credential.credentialRecord)

              return [entry.inputDescriptorId, [credentialRecord]] as [string, (typeof credentialRecord)[]]
            })
          )
        )
      )
    : undefined

  // TODO: support credential selection for DCQL
  const dcqlCredentials = resolvedRequest.queryResult
    ? agent.modules.openId4VcHolder.selectCredentialsForDcqlRequest(resolvedRequest.queryResult)
    : undefined

  try {
    // Temp solution to add and remove the trusted certificate
    const certificate =
      authorizationRequest.jwt && allowUntrustedCertificate ? extractCertificateFromJwt(authorizationRequest.jwt) : null

    const result = await withTrustedCertificate(agent, certificate, () =>
      agent.modules.openId4VcHolder.acceptSiopAuthorizationRequest({
        authorizationRequest,
        presentationExchange: presentationExchangeCredentials
          ? {
              credentials: presentationExchangeCredentials,
            }
          : undefined,
        dcql: dcqlCredentials
          ? {
              credentials: dcqlCredentials,
            }
          : undefined,
      })
    )

    // if redirect_uri is provided, open it in the browser
    // Even if the response returned an error, we must open this uri
    if (result.redirectUri) {
      await Linking.openURL(result.redirectUri)
    }

    if (result.serverResponse.status < 200 || result.serverResponse.status > 299) {
      throw new Error(
        `Error while accepting authorization request. ${JSON.stringify(result.serverResponse.body, null, 2)}`
      )
    }

    return result
  } catch (error) {
    // Handle biometric authentication errors
    throw BiometricAuthenticationError.tryParseFromError(error) ?? error
  }
}

/**
 * @todo we probably need a way to cancel this method, if the qr scanner is .e.g dismissed.
 */
export async function receiveOutOfBandInvitation(
  agent: FullAppAgent,
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
    const receivedInvite = await agent.oob.findByReceivedInvitationId(invitation.id)
    if (receivedInvite) {
      return {
        success: false,
        error: 'Invitation has already been scanned.',
      }
    }

    const receiveInvitationResult = await agent.oob.receiveInvitation(invitation, {
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
      await agent.connections.deleteById(connectionRecord.id)
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
