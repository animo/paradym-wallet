import type { AppAgent } from './agent'
import type {
  ConnectionRecord,
  CredentialStateChangedEvent,
  JwkDidCreateOptions,
  KeyDidCreateOptions,
  OutOfBandInvitation,
  OutOfBandRecord,
  ProofStateChangedEvent,
  W3cCredentialRecord,
} from '@aries-framework/core'
import type { PlaintextMessage } from '@aries-framework/core/build/types'
import type {
  PresentationSubmission,
  VerifiedAuthorizationRequestWithPresentationDefinition,
} from '@internal/openid4vc-client'

import { V1OfferCredentialMessage, V1RequestPresentationMessage } from '@aries-framework/anoncreds'
import {
  CredentialEventTypes,
  CredentialState,
  OutOfBandRepository,
  parseMessageType,
  ProofEventTypes,
  ProofState,
  V2OfferCredentialMessage,
  V2RequestPresentationMessage,
  DidJwk,
  DidKey,
  JwaSignatureAlgorithm,
} from '@aries-framework/core'
import { W3cCredentialRepository } from '@aries-framework/core/build/modules/vc/repository'
import { supportsIncomingMessageType } from '@aries-framework/core/build/utils/messageType'
import { OpenId4VpClientService, OpenIdCredentialFormatProfile } from '@internal/openid4vc-client'
import { getHostNameFromUrl } from '@internal/utils'
import queryString from 'query-string'
import { filter, firstValueFrom, merge, first, timeout } from 'rxjs'

export enum QrTypes {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance://',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer://',
  OPENID = 'openid://',
  OPENID_VC = 'openid-vc://',
  DIDCOMM = 'didcomm://',
}

export const isOpenIdCredentialOffer = (url: string) => {
  return (
    url.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE) ||
    url.startsWith(QrTypes.OPENID_CREDENTIAL_OFFER)
  )
}

export const isOpenIdPresentationRequest = (url: string) => {
  return url.startsWith(QrTypes.OPENID) || url.startsWith(QrTypes.OPENID_VC)
}

export const receiveCredentialFromOpenId4VciOffer = async ({
  agent,
  data,
}: {
  agent: AppAgent
  data: string
}) => {
  if (!isOpenIdCredentialOffer(data))
    throw new Error('URI does not start with OpenID issuance prefix.')

  const records = await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
    uri: data,
    proofOfPossessionVerificationMethodResolver: async ({
      supportedDidMethods,
      keyType,
      supportsAllDidMethods,
    }) => {
      // Prefer did:jwk, otherwise use did:key, otherwise use undefined
      const didMethod =
        supportsAllDidMethods || supportedDidMethods?.includes('did:jwk')
          ? 'jwk'
          : // If supportedDidMethods is undefined, it means we couldn't determine the supported did methods
          // This is either because an inline credential offer was used, or the issuer didn't declare which
          // did methods are supported.
          // NOTE: MATTR launchpad for JFF MUST use did:key. So it is important that the default
          // method is did:key if supportedDidMethods is undefined.
          supportedDidMethods?.includes('did:key') || supportedDidMethods === undefined
          ? 'key'
          : undefined

      if (!didMethod) {
        throw new Error(
          `No supported did method could be found. Supported methods are did:key and did:jwk. Issuer supports ${
            supportedDidMethods?.join(', ') ?? 'Unknown'
          }`
        )
      }

      const didResult = await agent.dids.create<JwkDidCreateOptions | KeyDidCreateOptions>({
        method: didMethod,
        options: {
          keyType,
        },
      })

      if (didResult.didState.state !== 'finished') {
        throw new Error('DID creation failed.')
      }

      let verificationMethodId: string
      if (didMethod === 'jwk') {
        const didJwk = DidJwk.fromDid(didResult.didState.did)
        verificationMethodId = didJwk.verificationMethodId
      } else {
        const didKey = DidKey.fromDid(didResult.didState.did)
        verificationMethodId = `${didKey.did}#${didKey.key.fingerprint}`
      }

      return didResult.didState.didDocument.dereferenceKey(verificationMethodId)
    },
    verifyCredentialStatus: false,
    allowedCredentialFormats: [OpenIdCredentialFormatProfile.JwtVcJson],
    allowedProofOfPossessionSignatureAlgorithms: [
      // NOTE: MATTR launchpad for JFF MUST use EdDSA. So it is important that the default (first allowed one)
      // is EdDSA. The list is ordered by preference, so if no suites are defined by the issuer, the first one
      // will be used
      JwaSignatureAlgorithm.EdDSA,
      JwaSignatureAlgorithm.ES256,
    ],
  })

  if (!records || !records.length)
    throw new Error('Error storing credential using pre authorized flow.')

  return records[0]
}

export const getCredentialsForProofRequest = async ({
  data,
  agent,
}: {
  data: string
  agent: AppAgent
}) => {
  if (!isOpenIdPresentationRequest(data)) throw new Error('URI does not start with OpenID prefix.')

  const openId4VpClientService = agent.dependencyManager.resolve(OpenId4VpClientService)
  const results = await openId4VpClientService.selectCredentialForProofRequest(agent.context, {
    authorizationRequest: data,
  })

  return {
    ...results,
    verifierHostName: getHostNameFromUrl(results.verifiedAuthorizationRequest.redirectURI),
  }
}

export const shareProof = async ({
  agent,
  verifiedAuthorizationRequest,
  selectResults,
}: {
  agent: AppAgent
  verifiedAuthorizationRequest: VerifiedAuthorizationRequestWithPresentationDefinition
  selectResults: PresentationSubmission
}) => {
  const openId4VpClientService = agent.dependencyManager.resolve(OpenId4VpClientService)

  if (!selectResults.areRequirementsSatisfied) {
    throw new Error('Requirements are not satisfied.')
  }

  const credentialRecords = selectResults.requirements
    .flatMap((requirement) =>
      requirement.submission.flatMap((submission) => submission.verifiableCredential)
    )
    .filter(
      (credentialRecord): credentialRecord is W3cCredentialRecord => credentialRecord !== undefined
    )

  const credentials = credentialRecords.map((credentialRecord) => credentialRecord.credential)

  await openId4VpClientService.shareProof(agent.context, {
    verifiedAuthorizationRequest,
    selectedCredentials: credentials,
  })
}

export async function storeW3cCredential(
  agent: AppAgent,
  w3cCredentialRecord: W3cCredentialRecord
) {
  const w3cCredentialRepository = agent.dependencyManager.resolve(W3cCredentialRepository)

  await w3cCredentialRepository.save(agent.context, w3cCredentialRecord)
}

/**
 * @todo we probably need a way to cancel this method, if the qr scanner is .e.g dismissed.
 */
export async function receiveOutOfBandInvitation(
  agent: AppAgent,
  invitation: OutOfBandInvitation
): Promise<
  | { result: 'success'; credentialExchangeId: string }
  | { result: 'success'; proofExchangeId: string }
  | { result: 'error'; message: string }
> {
  const requestMessages = invitation.getRequests() ?? []

  if (requestMessages.length > 1) {
    const message =
      'Message contains multiple requests. Invitation should only contain a single request.'
    agent.config.logger.error(message)
    return {
      result: 'error',
      message,
    }
  }

  // In this case we probably need to create a connection first. We will do this here, as we don't allow to just
  // create a connection
  if (requestMessages.length === 0) {
    if (!invitation.handshakeProtocols || invitation.handshakeProtocols.length === 0) {
      agent.config.logger.error('No requests and no handshake protocols found in invitation.')
      return {
        result: 'error',
        message: 'Invalid invitation.',
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
        result: 'error',
        message: 'Invalid invitation.',
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

  const proofRequest = agent.events
    .observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged)
    .pipe(
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
        result: 'error',
        message: 'Invitation has already been scanned.',
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
      result: 'error',
      message: 'Invalid invitation.',
    }
  }

  try {
    const event = await eventPromise
    agent.config.logger.debug(`Received event ${event.type}`)

    if (event.type === CredentialEventTypes.CredentialStateChanged) {
      return {
        result: 'success',
        credentialExchangeId: event.payload.credentialRecord.id,
      }
    } else if (event.type === ProofEventTypes.ProofStateChanged) {
      return {
        result: 'success',
        proofExchangeId: event.payload.proofRecord.id,
      }
    }
  } catch (error) {
    agent.config.logger.error(
      `Error while waiting for credential offer or proof request. Deleting connection and records`
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
      result: 'error',
      message: 'Invalid invitation.',
    }
  }

  return {
    result: 'error',
    message: 'Invalid invitation.',
  }
}

export async function tryParseDidCommInvitation(
  agent: AppAgent,
  invitationUrl: string
): Promise<OutOfBandInvitation | null> {
  try {
    const parsedUrl = queryString.parseUrl(invitationUrl)
    const updatedInvitationUrl = (parsedUrl['url'] as string | undefined) ?? invitationUrl

    // Try to parse the invitation as an DIDComm invitation.
    // We can't know for sure, as it could be a shortened URL to a DIDComm invitation.
    // So we use the parseMessage from AFJ and see if this returns a valid message.
    // Parse invitation supports legacy connection invitations, oob invitations, and
    // legacy connectionless invitations, and will all transform them into an OOB invitation.
    const invitation = await agent.oob.parseInvitation(updatedInvitationUrl)

    agent.config.logger.debug(`Parsed didcomm invitation with id ${invitation.id}`)
    return invitation
  } catch (error) {
    agent.config.logger.debug(
      `Ignoring error during parsing of didcomm invitation, could be another type of invitation.`
    )
    // We continue, as it could be there's other types of QRs besides DIDComm
    return null
  }
}
