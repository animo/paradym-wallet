import { verifyOpenid4VpAuthorizationRequest } from '@animo-id/eudi-wallet-functionality'
import { V1OfferCredentialMessage, V1RequestPresentationMessage } from '@credo-ts/anoncreds'
import type { DifPresentationExchangeDefinitionV2, P256Jwk } from '@credo-ts/core'
import { JwaSignatureAlgorithm, Jwt } from '@credo-ts/core'
import type { PlaintextMessage } from '@credo-ts/core/build/types'
import type {
  ConnectionRecord,
  CredentialStateChangedEvent,
  OutOfBandInvitation,
  OutOfBandRecord,
  ProofStateChangedEvent,
} from '@credo-ts/didcomm'
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
import type {
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciDpopRequestOptions,
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'
import {
  getOfferedCredentials,
  getScopesFromCredentialConfigurationsSupported,
  preAuthorizedCodeGrantIdentifier,
} from '@credo-ts/openid4vc'
import { getOid4vcCallbacks } from '@credo-ts/openid4vc/build/shared/callbacks'
import { eudiTrustList } from '@easypid/constants'
import { isParadymWallet } from '@easypid/hooks/useFeatureFlag'
import { Oauth2Client, clientAuthenticationNone, getAuthorizationServerMetadataFromList } from '@openid4vc/oauth2'
import { getOpenid4vpClientId } from '@openid4vc/openid4vp'
import type { DidCommAgent } from '@paradym/wallet-sdk/agent'
import { ParadymWalletBiometricAuthenticationError } from '@paradym/wallet-sdk/error'
import { formatDcqlCredentialsForRequest } from '@paradym/wallet-sdk/format/dcqlRequest'
import { formatDifPexCredentialsForRequest } from '@paradym/wallet-sdk/format/presentationExchangeRequest'
import type { FormattedSubmission } from '@paradym/wallet-sdk/format/submission'
import {
  extractOpenId4VcCredentialMetadata,
  setBatchCredentialMetadata,
  setOpenId4VcCredentialMetadata,
} from '@paradym/wallet-sdk/metadata/credentials'
import { getCredentialBindingResolver } from '@paradym/wallet-sdk/openid4vc/credentialBindingResolver'
import { credentialRecordFromCredential, encodeCredential } from '@paradym/wallet-sdk/utils/encoding'
import q from 'query-string'
import { type Observable, filter, first, firstValueFrom, timeout } from 'rxjs'
import type { ParadymAppAgent } from '../agent'
import type { EitherAgent } from '../agent'
import { getTrustedEntities } from '../utils/trust'
import { fetchInvitationDataUrl } from './fetchInvitation'

export type TrustedX509Entity = {
  certificate: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
}

export async function resolveOpenId4VciOffer({
  agent,
  offer,
  authorization,
  customHeaders,
  fetchAuthorization = true,
}: {
  agent: EitherAgent
  offer: { uri: string }
  authorization?: { clientId: string; redirectUri: string }
  customHeaders?: Record<string, unknown>
  fetchAuthorization?: boolean
}) {
  try {
    agent.config.logger.info(`Receiving openid uri ${offer.uri}`, {
      uri: offer.uri,
    })

    const resolvedCredentialOffer = await agent.modules.openId4VcHolder.resolveCredentialOffer(offer.uri)
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
  } catch (error) {
    // NOTE: Error thrown by resolveCredentialOffer are not caught correctly on the app level
    // So we wrap it in a try/catch block.
    throw new Error(`${error}`)
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
  const oauth2Client = new Oauth2Client({
    callbacks: {
      ...getOid4vcCallbacks(agent.context),
      // TODO: support client attestation for pid referesh
      clientAuthentication: clientAuthenticationNone({ clientId }),
    },
  })

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
      allowedProofOfPossessionSignatureAlgorithms: [JwaSignatureAlgorithm.ES256, JwaSignatureAlgorithm.EdDSA],
      credentialBindingResolver: getCredentialBindingResolver({
        pidSchemes,
        requestBatch,
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
    throw ParadymWalletBiometricAuthenticationError.tryParseFromError(error) ?? error
  }
}

const extractEntityIdFromJwt = (jwt: string, origin?: string): string | null => {
  const jwtPayload = Jwt.fromSerializedJwt(jwt).payload

  return extractEntityIdFromPayload(jwtPayload.additionalClaims, origin)
}

const extractEntityIdFromPayload = (payload: Record<string, unknown>, origin?: string): string | null => {
  const { clientId, clientIdScheme } = getOpenid4vpClientId({
    clientId: payload.client_id as string,
    legacyClientIdScheme: payload.client_id_scheme,
    responseMode: payload.response_mode,
    origin,
  })

  if (clientIdScheme === 'https') return clientId
  return null
}

/**
 * This is a temp method to allow for untrusted certificates to still work with the wallet.
 */
export const extractEntityIdFromAuthorizationRequest = async ({
  uri,
  requestPayload,
  origin,
}: { uri?: string; requestPayload?: Record<string, unknown>; origin?: string }): Promise<{
  data: string | null
  entityId: string | null
}> => {
  try {
    if (typeof requestPayload?.request === 'string') {
      return {
        data: null,
        entityId: extractEntityIdFromJwt(requestPayload.request, origin),
      }
    }

    if (requestPayload) {
      return {
        data: null,
        entityId: extractEntityIdFromPayload(requestPayload, origin),
      }
    }

    if (uri) {
      const query = q.parseUrl(uri).query
      if (query.request_uri && typeof query.request_uri === 'string') {
        const result = await fetchInvitationDataUrl(query.request_uri)

        if (
          result.success &&
          result.result.type === 'openid-authorization-request' &&
          result.result.format === 'parsed' &&
          typeof result.result.data === 'string'
        ) {
          return {
            data: result.result.data,
            entityId: extractEntityIdFromJwt(result.result.data, origin),
          }
        }
      } else if (query.request && typeof query.request === 'string') {
        return {
          data: null,
          entityId: extractEntityIdFromJwt(query.request, origin),
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
  requestPayload?: Record<string, unknown>
  uri?: string
  allowUntrusted?: boolean
  origin?: string
  trustedX509Entities?: TrustedX509Entity[]
}

export const getCredentialsForProofRequest = async ({
  agent,
  uri,
  requestPayload,
  allowUntrusted = true,
  origin,
  trustedX509Entities = [],
}: GetCredentialsForProofRequestOptions) => {
  const { entityId = undefined, data: fromFederationData = null } = allowUntrusted
    ? await extractEntityIdFromAuthorizationRequest({ uri, requestPayload, origin })
    : {}

  let request: string | Record<string, unknown>
  if (fromFederationData) {
    if (!uri) {
      throw new Error('Missing required uri')
    }

    const updatedUrl = new URL(uri)
    updatedUrl.searchParams.delete('request_uri')
    updatedUrl.searchParams.set('request', fromFederationData)

    request = updatedUrl.toJSON()
  } else if (uri) {
    request = uri
  } else if (requestPayload) {
    request = requestPayload
  } else {
    throw new Error('Either requestPayload or uri must be provided')
  }

  agent.config.logger.info('Receiving openid request', {
    request,
  })

  const resolved = await agent.modules.openId4VcHolder.resolveOpenId4VpAuthorizationRequest(request, {
    origin,
    trustedFederationEntityIds: entityId ? [entityId] : undefined,
  })

  const authorizationRequestVerificationResult = await verifyOpenid4VpAuthorizationRequest(agent.context, {
    resolvedAuthorizationRequest: resolved,
    allowUntrustedSigned: allowUntrusted,
  })

  const { trustMechanism, trustedEntities, relyingParty } = await getTrustedEntities({
    agent,
    trustedX509Entities,
    resolvedAuthorizationRequest: resolved,
    origin,
    authorizationRequestVerificationResult,
    walletTrustedEntity: {
      organizationName: isParadymWallet() ? 'Paradym Wallet' : 'Funke Wallet',
      entityId: '__',
      logoUri: require('../../../../apps/easypid/assets/paradym/icon.png'),
      uri: isParadymWallet() ? 'https://paradym.id' : 'https://funke.animo.id',
    },
    trustList: eudiTrustList,
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
      hostName: relyingParty.uri,
      entityId: relyingParty.entityId,
      logo: relyingParty.logoUri
        ? {
            url: relyingParty.logoUri,
          }
        : undefined,
      name: relyingParty.organizationName,
      trustedEntities,
    },
    formattedSubmission,
    transactionData: resolved.transactionData,
    trustMechanism,
  } as const
}

async function findExistingDidcommConnectionForInvitation(
  agent: DidCommAgent,
  outOfBandInvitation: OutOfBandInvitation
): Promise<ConnectionRecord | null> {
  for (const invitationDid of outOfBandInvitation.invitationDids) {
    const [connection] = await agent.modules.connections.findByInvitationDid(invitationDid)
    if (connection) return connection
  }

  return null
}

export interface ResolveOutOfBandInvitationResultSuccess {
  success: true

  outOfBandInvitation: OutOfBandInvitation

  /**
   * Whether an existing connection already exists based on this invitation
   */
  existingConnection?: ConnectionRecord

  /**
   * Whether a connection will be created as part of the exchange.
   *
   * When `existingConnection` is defined this will always be `false` as
   * the existing connection will be reused.
   *
   * If `createConnection` is `false` and `existingConnection` is undefined
   * it means the exchange will be connectionless.
   */
  createConnection: boolean

  /**
   * The flow type as indicated by the invitation.
   *
   * - `issue` when the goal code indicates the goal of the invitation is to issue, or a credential offer is attached
   * - `verify` when the goal code indicates the goal of the invittion is to verify, or a presentation request is attached
   * - `connect` in all other cases
   */
  flowType: 'issue' | 'verify' | 'connect'
}

/**
 * @todo we probably need a way to cancel this method, if the qr scanner is .e.g dismissed.
 */
export async function resolveOutOfBandInvitation(
  agent: DidCommAgent,
  invitation: OutOfBandInvitation
): Promise<ResolveOutOfBandInvitationResultSuccess | { success: false; error: string }> {
  const requestMessages = invitation.getRequests() ?? []

  let flowType: 'issue' | 'verify' | 'connect'

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

    if (invitation.goalCode === 'issue-vc' || invitation.goalCode === 'aries.vc.issue') {
      flowType = 'issue'
    } else if (invitation.goalCode === 'request-proof' || invitation.goalCode === 'aries.vc.verify') {
      flowType = 'verify'
    } else {
      flowType = 'connect'
    }
  }
  // Validate the type of the request message
  else {
    const requestMessage = requestMessages[0] as PlaintextMessage
    const parsedMessageType = parseMessageType(requestMessage['@type'])
    const isValidOfferMessage =
      supportsIncomingMessageType(parsedMessageType, V1OfferCredentialMessage.type) ||
      supportsIncomingMessageType(parsedMessageType, V2OfferCredentialMessage.type)

    const isValidRequestMessage =
      supportsIncomingMessageType(parsedMessageType, V1RequestPresentationMessage.type) ||
      supportsIncomingMessageType(parsedMessageType, V2RequestPresentationMessage.type)

    if (isValidRequestMessage) {
      flowType = 'verify'
    } else if (isValidOfferMessage) {
      flowType = 'issue'
    } else {
      agent.config.logger.error('Message request is not from supported protocol.')
      return {
        success: false,
        error: 'Invalid invitation.',
      }
    }
  }

  try {
    // Check if invitation already exists
    const receivedInvite = await agent.modules.outOfBand.findByReceivedInvitationId(invitation.id)
    if (receivedInvite) {
      return {
        success: false,
        error: 'Invitation has already been scanned.',
      }
    }

    const existingConnection = (await findExistingDidcommConnectionForInvitation(agent, invitation)) ?? undefined

    return {
      success: true,
      outOfBandInvitation: invitation,
      // biome-ignore lint/complexity/noUselessTernary: <explanation>
      createConnection: existingConnection ? false : invitation.handshakeProtocols?.length ? true : false,
      existingConnection,
      flowType,
    }
  } catch (error) {
    agent.config.logger.error(`Error while receiving invitation: ${error as string}`)

    return {
      success: false,
      error: 'Invalid invitation.',
    }
  }
}

export type AcceptOutOfBandInvitationResult<FlowType extends 'issue' | 'verify' | 'connect'> = Promise<
  | { success: false; error: string }
  | (FlowType extends 'issue'
      ? { success: true; flowType: 'issue'; credentialExchangeId: string; connectionId?: string }
      : FlowType extends 'verify'
        ? { success: true; flowType: 'verify'; proofExchangeId: string; connectionId?: string }
        : FlowType extends 'connect'
          ? { success: true; flowType: 'connect'; connectionId: string }
          : never)
>

/**
 * NOTE: this method assumes `resolveOutOfBandInvitation` was called previously and thus no additional checks are performed.
 */
export async function acceptOutOfBandInvitation<FlowType extends 'issue' | 'verify' | 'connect'>(
  agent: ParadymAppAgent,
  invitation: OutOfBandInvitation,
  flowType: FlowType
): AcceptOutOfBandInvitationResult<FlowType> {
  // The value is reassigned, but eslint doesn't know this.
  let connectionId: string | undefined

  let observable: Observable<CredentialStateChangedEvent | ProofStateChangedEvent> | undefined = undefined

  if (flowType === 'issue') {
    observable = agent.events.observable<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged).pipe(
      filter((event) => event.payload.credentialRecord.state === CredentialState.OfferReceived),
      filter((event) => event.payload.credentialRecord.connectionId === connectionId)
    )
  } else if (flowType === 'verify') {
    observable = agent.events.observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged).pipe(
      filter((event) => event.payload.proofRecord.state === ProofState.RequestReceived),
      filter((event) => event.payload.proofRecord.connectionId === connectionId)
    )
  }

  const eventPromise = observable
    ? firstValueFrom(
        observable.pipe(
          first(),
          // We allow 15 seconds to receive a credential offer or proof request
          timeout(15 * 1000)
        )
      )
    : undefined

  let connectionRecord: ConnectionRecord | undefined
  let outOfBandRecord: OutOfBandRecord

  try {
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
    agent.config.logger.debug(`Received event ${event?.type}`)

    if (!event) {
      return {
        success: true,
        connectionId: connectionId as string,
        flowType: 'connect',
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } as unknown as any
    }

    if (event.type === CredentialEventTypes.CredentialStateChanged) {
      return {
        success: true,
        credentialExchangeId: event.payload.credentialRecord.id,
        connectionId,
        flowType: 'issue',
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } as unknown as any
    }
    if (event.type === ProofEventTypes.ProofStateChanged) {
      return {
        success: true,
        proofExchangeId: event.payload.proofRecord.id,
        connectionId,
        flowType: 'verify',
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } as unknown as any
    }
  } catch (error) {
    agent.config.logger.error('Error while accepting out of band invitation.')

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
