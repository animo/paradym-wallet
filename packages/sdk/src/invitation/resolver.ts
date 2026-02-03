import { DidCommRequestPresentationV1Message, V1OfferCredentialMessage } from '@credo-ts/anoncreds'
import { CredoError, Kms } from '@credo-ts/core'
import {
  type DidCommConnectionRecord,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommOfferCredentialV2Message,
  type DidCommOutOfBandInvitation,
  type DidCommOutOfBandRecord,
  DidCommOutOfBandRepository,
  type DidCommPlaintextMessage,
  DidCommProofEventTypes,
  DidCommProofState,
  type DidCommProofStateChangedEvent,
  DidCommRequestPresentationV2Message,
  parseMessageType,
  supportsIncomingMessageType,
} from '@credo-ts/didcomm'
import {
  getOfferedCredentials,
  getScopesFromCredentialConfigurationsSupported,
  OpenId4VciAuthorizationFlow,
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'
import { filter, first, firstValueFrom, type Observable, timeout } from 'rxjs'
import { assertAgentType, assertDidcommAgent } from '../agent'
import type { CredentialDisplay } from '../display/credential'
import {
  ParadymWalletInvitationAlreadyUsedError,
  ParadymWalletInvitationDidcommUnsupportedProtocolError,
  ParadymWalletInvitationError,
  ParadymWalletInvitationMultipleRequestsError,
  ParadymWalletInvitationParseError,
  ParadymWalletInvitationReceiveError,
} from '../error'
import {
  extractOpenId4VcCredentialMetadata,
  setBatchCredentialMetadata,
  setOpenId4VcCredentialMetadata,
} from '../metadata/credentials'
import { getCredentialBindingResolver } from '../openid4vc/credentialBindingResolver'
import { getCredentialDisplayForOffer } from '../openid4vc/func/getCredentialDisplayForOffer'
import { type CredentialsForProofRequest, resolveCredentialRequest } from '../openid4vc/func/resolveCredentialRequest'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

export type AcceptOutOfBandInvitationResult<FlowType extends 'issue' | 'verify' | 'connect'> = Promise<
  FlowType extends 'issue'
    ? { flowType: 'issue'; credentialExchangeId: string; connectionId?: string }
    : FlowType extends 'verify'
      ? { flowType: 'verify'; proofExchangeId: string; connectionId?: string }
      : FlowType extends 'connect'
        ? { flowType: 'connect'; connectionId: string }
        : never
>

export type ResolveOutOfBandInvitationResult = {
  outOfBandInvitation: DidCommOutOfBandInvitation

  /**
   * Whether an existing connection already exists based on this invitation
   */
  existingConnection?: DidCommConnectionRecord

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

export type ResolveCredentialOfferOptions = {
  paradym: ParadymWalletSdk
  offerUri: string
  authorization?: { clientId: string; redirectUri: string }
  fetchAuthorization?: boolean
}

// TODO: export from openid4vc
export type TransactionCodeInfo = {
  description?: string
  length?: number
  input_mode?: 'numeric' | 'text'
}

type OpenId4VciResolvedAuthRequestPresentationDuringIssuance = Extract<
  OpenId4VciResolvedAuthorizationRequest,
  { authorizationFlow: OpenId4VciAuthorizationFlow.PresentationDuringIssuance }
>

type OpenId4VciResolvedAuthRequestOauth2Redirect = Extract<
  OpenId4VciResolvedAuthorizationRequest,
  { authorizationFlow: OpenId4VciAuthorizationFlow.Oauth2Redirect }
>

type ResolveCredentialOfferPreAuthReturn = {
  flow: 'pre-auth'
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  credentialDisplay: CredentialDisplay
}

type ResolveCredentialOfferPreAuthWithTxCodeReturn = {
  flow: 'pre-auth-with-tx-code'
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  credentialDisplay: CredentialDisplay
  txCodeInfo: {
    description?: string
    length?: number
    input_mode?: 'numeric' | 'text'
  }
}

type ResolveCredentialOfferAuthReturn = {
  flow: 'auth'
  credentialDisplay: CredentialDisplay
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  resolvedAuthorizationRequest: OpenId4VciResolvedAuthRequestOauth2Redirect
}

type ResolveCredentialOfferAuthPresentationDuringIssuanceReturn = {
  flow: 'auth-presentation-during-issuance'
  credentialDisplay: CredentialDisplay
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  resolvedAuthorizationRequest: OpenId4VciResolvedAuthRequestPresentationDuringIssuance
  credentialsForProofRequest: CredentialsForProofRequest
}

export type ResolveCredentialOfferReturn =
  | ResolveCredentialOfferPreAuthReturn
  | ResolveCredentialOfferPreAuthWithTxCodeReturn
  | ResolveCredentialOfferAuthReturn
  | ResolveCredentialOfferAuthPresentationDuringIssuanceReturn

export async function resolveCredentialOffer({
  paradym,
  offerUri,
  authorization,
  fetchAuthorization = true,
}: ResolveCredentialOfferOptions): Promise<ResolveCredentialOfferReturn> {
  assertAgentType(paradym.agent, 'openid4vc')
  paradym.logger.info(`Receiving openid uri '${offerUri}'`)

  const resolvedCredentialOffer = await paradym.agent.openid4vc.holder.resolveCredentialOffer(offerUri)
  let resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest | undefined

  const preAuthGrant =
    resolvedCredentialOffer.credentialOfferPayload.grants?.['urn:ietf:params:oauth:grant-type:pre-authorized_code']

  const txCodeInfo = preAuthGrant?.tx_code

  const credentialDisplay = getCredentialDisplayForOffer(resolvedCredentialOffer)

  if (preAuthGrant) {
    if (txCodeInfo) {
      return {
        flow: 'pre-auth-with-tx-code',
        credentialDisplay,
        resolvedCredentialOffer,
        txCodeInfo,
      }
    }
    return {
      flow: 'pre-auth',
      credentialDisplay,
      resolvedCredentialOffer,
    }
  }

  // NOTE: we always assume scopes are used at the moment
  if (fetchAuthorization && resolvedCredentialOffer.credentialOfferPayload.grants?.authorization_code) {
    // If only authorization_code grant is valid and user didn't provide authorization details we can't continue
    if (!authorization) {
      throw new Error(
        "Missing 'authorization' parameter with 'clientId' and 'redirectUri' and authorization code flow is only allowed grant type on offer."
      )
    }

    // TODO: authorization should only be initiated after we know which credentials we're going to request
    resolvedAuthorizationRequest = await paradym.agent.openid4vc.holder.resolveOpenId4VciAuthorizationRequest(
      resolvedCredentialOffer,
      {
        redirectUri: authorization.redirectUri,
        clientId: authorization.clientId,
        scope: getScopesFromCredentialConfigurationsSupported(resolvedCredentialOffer.offeredCredentialConfigurations),
      }
    )

    if (resolvedAuthorizationRequest.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance) {
      const credentialsForProofRequest = await resolveCredentialRequest({
        paradym,
        uri: resolvedAuthorizationRequest.openid4vpRequestUrl,
      })

      return {
        flow: 'auth-presentation-during-issuance',
        credentialDisplay,
        resolvedCredentialOffer,
        resolvedAuthorizationRequest,
        credentialsForProofRequest,
      }
    }

    return {
      flow: 'auth',
      credentialDisplay,
      resolvedCredentialOffer,
      resolvedAuthorizationRequest,
    }
  }

  throw new Error(
    `Unable to determine whether it is the auth of pre-auth flow with the following grants: [${Object.keys(resolvedCredentialOffer.credentialOfferPayload.grants ?? {}).join(', ')}]`
  )
}

export async function acquirePreAuthorizedAccessToken({
  paradym,
  resolvedCredentialOffer,
  txCode,
}: {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  txCode?: string
}) {
  assertAgentType(paradym.agent, 'openid4vc')
  return await paradym.agent.openid4vc.holder.requestToken({
    resolvedCredentialOffer,
    txCode,
  })
}

/**
 *
 * @todo how do we want to deal with the `pid` credential here?
 *
 */
export const receiveCredentialFromOpenId4VciOffer = async ({
  paradym,
  resolvedCredentialOffer,
  credentialConfigurationIdsToRequest,
  accessToken,
  clientId,
  pidSchemes,
  requestBatch,
}: {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  credentialConfigurationIdsToRequest?: string[]
  clientId?: string
  pidSchemes?: { sdJwtVcVcts: Array<string>; msoMdocDoctypes: Array<string> }
  requestBatch?: boolean | number

  // TODO: cNonce should maybe be provided separately (multiple calls can have different c_nonce values)
  accessToken: OpenId4VciRequestTokenResponse
}) => {
  assertAgentType(paradym.agent, 'openid4vc')
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

  const { credentials, deferredCredentials } = await paradym.agent.openid4vc.holder.requestCredentials({
    resolvedCredentialOffer,
    ...accessToken,
    clientId,
    credentialConfigurationIds: Object.keys(offeredCredentialsToRequest),
    verifyCredentialStatus: false,
    allowedProofOfPossessionSignatureAlgorithms: [
      Kms.KnownJwaSignatureAlgorithms.ES256,
      Kms.KnownJwaSignatureAlgorithms.EdDSA,
    ],
    credentialBindingResolver: getCredentialBindingResolver({
      pidSchemes,
      requestBatch,
    }),
  })

  const creds = credentials.map(({ record, ...credentialResponse }) => {
    const configuration = resolvedCredentialOffer.offeredCredentialConfigurations[
      credentialResponse.credentialConfigurationId
    ] as OpenId4VciCredentialConfigurationSupportedWithFormats

    // OpenID4VC metadata
    const openId4VcMetadata = extractOpenId4VcCredentialMetadata(configuration, {
      id: resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
      display: resolvedCredentialOffer.metadata.credentialIssuer.display,
    })
    setOpenId4VcCredentialMetadata(record, openId4VcMetadata)

    // Batch metadata
    if (credentials.length > 1) {
      setBatchCredentialMetadata(record, {
        additionalCredentials: credentials.slice(1).map((c) => c.record.encoded) as
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

  return {
    credentials: creds,
    deferredCredentials,
  }
}

export async function resolveOutOfBandInvitation(
  paradym: ParadymWalletSdk,
  invitation: DidCommOutOfBandInvitation
): Promise<ResolveOutOfBandInvitationResult> {
  assertDidcommAgent(paradym.agent)
  const requestMessages = invitation.getRequests() ?? []

  let flowType: 'issue' | 'verify' | 'connect'

  if (requestMessages.length > 1) {
    const message = 'Message contains multiple requests. Invitation should only contain a single request.'
    paradym.logger.error(message)
    throw new ParadymWalletInvitationMultipleRequestsError(message)
  }

  // In this case we probably need to create a connection first. We will do this here, as we don't allow to just
  // create a connection
  if (requestMessages.length === 0) {
    if (!invitation.handshakeProtocols || invitation.handshakeProtocols.length === 0) {
      const message = 'No requests and no handshake protocols found in invitation.'
      paradym.logger.error(message)
      throw new ParadymWalletInvitationParseError(message)
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
    const requestMessage = requestMessages[0] as DidCommPlaintextMessage
    const parsedMessageType = parseMessageType(requestMessage['@type'])
    const isValidOfferMessage =
      supportsIncomingMessageType(parsedMessageType, V1OfferCredentialMessage.type) ||
      supportsIncomingMessageType(parsedMessageType, DidCommOfferCredentialV2Message.type)

    const isValidRequestMessage =
      supportsIncomingMessageType(parsedMessageType, DidCommRequestPresentationV1Message.type) ||
      supportsIncomingMessageType(parsedMessageType, DidCommRequestPresentationV2Message.type)

    if (isValidRequestMessage) {
      flowType = 'verify'
    } else if (isValidOfferMessage) {
      flowType = 'issue'
    } else {
      throw new ParadymWalletInvitationDidcommUnsupportedProtocolError()
    }
  }

  try {
    // Check if invitation already exists
    const receivedInvite = await paradym.agent.didcomm.oob.findByReceivedInvitationId(invitation.id)
    if (receivedInvite) {
      throw new ParadymWalletInvitationAlreadyUsedError()
    }

    const existingConnection = (await findExistingDidcommConnectionForInvitation(paradym, invitation)) ?? undefined

    return {
      outOfBandInvitation: invitation,
      createConnection: existingConnection ? false : !!invitation.handshakeProtocols?.length,
      existingConnection,
      flowType,
    }
  } catch (error) {
    paradym.logger.error(`Error while receiving invitation: ${error as string}`)
    throw new ParadymWalletInvitationError(error as string)
  }
}

async function findExistingDidcommConnectionForInvitation(
  paradym: ParadymWalletSdk,
  outOfBandInvitation: DidCommOutOfBandInvitation
): Promise<DidCommConnectionRecord | null> {
  assertDidcommAgent(paradym.agent)
  for (const invitationDid of outOfBandInvitation.invitationDids) {
    const [connection] = await paradym.agent.didcomm.connections.findByInvitationDid(invitationDid)
    if (connection) return connection
  }

  return null
}

/**
 * NOTE: this method assumes `resolveOutOfBandInvitation` was called previously and thus no additional checks are performed.
 */
export async function acceptOutOfBandInvitation<FlowType extends 'issue' | 'verify' | 'connect'>(
  paradym: ParadymWalletSdk,
  invitation: DidCommOutOfBandInvitation,
  flowType: FlowType
): AcceptOutOfBandInvitationResult<FlowType> {
  assertDidcommAgent(paradym.agent)
  // The value is reassigned, but eslint doesn't know this.
  let connectionId: string | undefined

  let observable: Observable<DidCommCredentialStateChangedEvent | DidCommProofStateChangedEvent> | undefined

  if (flowType === 'issue') {
    observable = paradym.agent.events
      .observable<DidCommCredentialStateChangedEvent>(DidCommCredentialEventTypes.DidCommCredentialStateChanged)
      .pipe(
        filter((event) => event.payload.credentialExchangeRecord.state === DidCommCredentialState.OfferReceived),
        filter((event) => event.payload.credentialExchangeRecord.connectionId === connectionId)
      )
  } else if (flowType === 'verify') {
    observable = paradym.agent.events
      .observable<DidCommProofStateChangedEvent>(DidCommProofEventTypes.ProofStateChanged)
      .pipe(
        filter((event) => event.payload.proofRecord.state === DidCommProofState.RequestReceived),
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

  let connectionRecord: DidCommConnectionRecord | undefined
  let outOfBandRecord: DidCommOutOfBandRecord

  try {
    const receiveInvitationResult = await paradym.agent.didcomm.oob.receiveInvitation(invitation, {
      label: '',
      reuseConnection: true,
    })
    connectionRecord = receiveInvitationResult.connectionRecord
    outOfBandRecord = receiveInvitationResult.outOfBandRecord

    // Assign connectionId so it can be used in the observables.
    connectionId = connectionRecord?.id
  } catch (error) {
    paradym.logger.error(`Error while receiving invitation.`, { error })
    if (error instanceof CredoError && error.message.includes('has already been received')) {
      throw new ParadymWalletInvitationAlreadyUsedError()
    }
    throw new ParadymWalletInvitationReceiveError()
  }

  try {
    const event = await eventPromise
    paradym.logger.debug(`Received event ${event?.type}`)

    if (!event) {
      return {
        connectionId: connectionId as string,
        flowType: 'connect',
      } as unknown as AcceptOutOfBandInvitationResult<FlowType>
    }

    if (event.type === DidCommCredentialEventTypes.DidCommCredentialStateChanged) {
      return {
        credentialExchangeId: event.payload.credentialExchangeRecord.id,
        connectionId,
        flowType: 'issue',
      } as unknown as AcceptOutOfBandInvitationResult<FlowType>
    }
    if (event.type === DidCommProofEventTypes.ProofStateChanged) {
      return {
        proofExchangeId: event.payload.proofRecord.id,
        connectionId,
        flowType: 'verify',
      } as unknown as AcceptOutOfBandInvitationResult<FlowType>
    }
  } catch (error) {
    paradym.logger.error('Error while accepting out of band invitation.', { error })

    // Delete OOB record
    const outOfBandRepository =
      paradym.agent.dependencyManager.resolve<DidCommOutOfBandRepository>(DidCommOutOfBandRepository)
    await outOfBandRepository.deleteById(paradym.agent.context, outOfBandRecord.id)

    // Delete connection record
    // TODO: delete did and mediation stuff
    if (connectionRecord) {
      await paradym.agent.didcomm.connections.deleteById(connectionRecord.id)
    }

    throw new ParadymWalletInvitationError()
  }

  throw new ParadymWalletInvitationError()
}
