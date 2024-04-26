import type { AppAgent } from '../agent'
import type {
  ConnectionRecord,
  CredentialStateChangedEvent,
  JwkDidCreateOptions,
  KeyDidCreateOptions,
  OutOfBandInvitation,
  OutOfBandRecord,
  ProofStateChangedEvent,
  DifPexCredentialsForRequest,
} from '@credo-ts/core'
import type { PlaintextMessage } from '@credo-ts/core/build/types'
import type {
  OpenId4VciCredentialSupportedWithId,
  OpenId4VcSiopVerifiedAuthorizationRequest,
} from '@credo-ts/openid4vc'

import { V1OfferCredentialMessage, V1RequestPresentationMessage } from '@credo-ts/anoncreds'
import {
  DifPresentationExchangeService,
  SdJwtVcRecord,
  SdJwtVcRepository,
  W3cCredentialRecord,
  W3cCredentialRepository,
  getJwkFromKey,
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
} from '@credo-ts/core'
import { supportsIncomingMessageType } from '@credo-ts/core/build/utils/messageType'
import { OpenId4VciCredentialFormatProfile } from '@credo-ts/openid4vc'
import { getHostNameFromUrl } from '@internal/utils'
import { filter, firstValueFrom, merge, first, timeout } from 'rxjs'

import {
  extractOpenId4VcCredentialMetadata,
  setOpenId4VcCredentialMetadata,
} from '../openid4vc/metadata'

export const receiveCredentialFromOpenId4VciOffer = async ({
  agent,
  data,
  uri,
}: {
  agent: AppAgent
  // Either data itself (the offer) or uri can be passed
  data?: string
  uri?: string
}) => {
  let offerUri = uri

  if (!offerUri && data) {
    // FIXME: Credo only support credential offer string, but we already parsed it before. So we construct an offer here
    // but in the future we need to support the parsed offer in Credo directly
    offerUri = `openid-credential-offer://credential_offer=${encodeURIComponent(
      JSON.stringify(data)
    )}`
  } else if (!offerUri) {
    throw new Error('either data or uri must be provided')
  }

  agent.config.logger.info(`Receiving openid uri ${offerUri}`, {
    offerUri,
    data,
    uri,
  })
  const resolvedCredentialOffer = await agent.modules.openId4VcHolder.resolveCredentialOffer(
    offerUri
  )

  // FIXME: return credential_supported entry for credential so it's easy to store metadata
  const credentials =
    await agent.modules.openId4VcHolder.acceptCredentialOfferUsingPreAuthorizedCode(
      resolvedCredentialOffer,
      {
        credentialBindingResolver: async ({
          supportedDidMethods,
          keyType,
          supportsAllDidMethods,
          supportsJwk,
          credentialFormat,
        }) => {
          // First, we try to pick a did method
          // Prefer did:jwk, otherwise use did:key, otherwise use undefined
          let didMethod: 'key' | 'jwk' | undefined =
            supportsAllDidMethods || supportedDidMethods?.includes('did:jwk')
              ? 'jwk'
              : supportedDidMethods?.includes('did:key')
              ? 'key'
              : undefined

          // If supportedDidMethods is undefined, and supportsJwk is false, we will default to did:key
          // this is important as part of MATTR launchpad support which MUST use did:key but doesn't
          // define which did methods they support
          if (!supportedDidMethods && !supportsJwk) {
            didMethod = 'key'
          }

          if (didMethod) {
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

            return {
              didUrl: verificationMethodId,
              method: 'did',
            }
          }

          // Otherwise we also support plain jwk for sd-jwt only
          if (supportsJwk && credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc) {
            const key = await agent.wallet.createKey({
              keyType,
            })
            return {
              method: 'jwk',
              jwk: getJwkFromKey(key),
            }
          }

          throw new Error(
            `No supported binding method could be found. Supported methods are did:key and did:jwk, or plain jwk for sd-jwt. Issuer supports ${
              supportsJwk ? 'jwk, ' : ''
            }${supportedDidMethods?.join(', ') ?? 'Unknown'}`
          )
        },

        verifyCredentialStatus: false,
        allowedProofOfPossessionSignatureAlgorithms: [
          // NOTE: MATTR launchpad for JFF MUST use EdDSA. So it is important that the default (first allowed one)
          // is EdDSA. The list is ordered by preference, so if no suites are defined by the issuer, the first one
          // will be used
          JwaSignatureAlgorithm.EdDSA,
          JwaSignatureAlgorithm.ES256,
        ],
      }
    )

  const [firstCredential] = credentials
  if (!firstCredential) throw new Error('Error retrieving credential using pre authorized flow.')

  let record: SdJwtVcRecord | W3cCredentialRecord

  // TODO: add claimFormat to SdJwtVc

  if ('compact' in firstCredential) {
    record = new SdJwtVcRecord({
      compactSdJwtVc: firstCredential.compact,
    })
  } else {
    record = new W3cCredentialRecord({
      credential: firstCredential,
      // We don't support expanded types right now, but would become problem when we support JSON-LD
      tags: {},
    })
  }

  const openId4VcMetadata = extractOpenId4VcCredentialMetadata(
    resolvedCredentialOffer.offeredCredentials[0] as OpenId4VciCredentialSupportedWithId,
    resolvedCredentialOffer.metadata
  )

  setOpenId4VcCredentialMetadata(record, openId4VcMetadata)

  return record
}

export const getCredentialsForProofRequest = async ({
  agent,
  data,
  uri,
}: {
  agent: AppAgent
  // Either data or uri can be provided
  data?: string
  uri?: string
}) => {
  let requestUri = uri

  if (!requestUri && data) {
    // FIXME: Credo only support request string, but we already parsed it before. So we construct an request here
    // but in the future we need to support the parsed request in Credo directly
    requestUri = `openid://request=${encodeURIComponent(data)}`
  } else if (!requestUri) {
    throw new Error('Either data or uri must be provided')
  }

  agent.config.logger.info(`Receiving openid uri ${requestUri}`, {
    data,
    uri,
    requestUri,
  })

  const resolved = await agent.modules.openId4VcHolder.resolveSiopAuthorizationRequest(requestUri)

  if (!resolved.presentationExchange) {
    throw new Error('No presentation exchange found in authorization request.')
  }

  return {
    ...resolved.presentationExchange,
    authorizationRequest: resolved.authorizationRequest,
    verifierHostName: resolved.authorizationRequest.responseURI
      ? getHostNameFromUrl(resolved.authorizationRequest.responseURI)
      : undefined,
  }
}

export const shareProof = async ({
  agent,
  authorizationRequest,
  credentialsForRequest,
}: {
  agent: AppAgent
  authorizationRequest: OpenId4VcSiopVerifiedAuthorizationRequest
  // TODO: support selection
  credentialsForRequest: DifPexCredentialsForRequest
}) => {
  const presentationExchangeService = agent.dependencyManager.resolve(
    DifPresentationExchangeService
  )

  const credentials = presentationExchangeService.selectCredentialsForRequest(credentialsForRequest)
  const result = await agent.modules.openId4VcHolder.acceptSiopAuthorizationRequest({
    authorizationRequest,
    presentationExchange: {
      credentials,
    },
  })

  if (result.serverResponse.status < 200 || result.serverResponse.status > 299) {
    throw new Error(
      `Error while accepting authorization request. ${result.serverResponse.body as string}`
    )
  }

  return result
}

export async function storeCredential(
  agent: AppAgent,
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord
) {
  if (credentialRecord instanceof W3cCredentialRecord) {
    await agent.dependencyManager
      .resolve(W3cCredentialRepository)
      .save(agent.context, credentialRecord)
  } else {
    await agent.dependencyManager.resolve(SdJwtVcRepository).save(agent.context, credentialRecord)
  }
}

/**
 * @todo we probably need a way to cancel this method, if the qr scanner is .e.g dismissed.
 */
export async function receiveOutOfBandInvitation(
  agent: AppAgent,
  invitation: OutOfBandInvitation
): Promise<
  | { success: true; id: string; type: 'credentialExchange' }
  | { success: true; id: string; type: 'proofExchange' }
  | { success: false; error: string }
> {
  const requestMessages = invitation.getRequests() ?? []

  if (requestMessages.length > 1) {
    const message =
      'Message contains multiple requests. Invitation should only contain a single request.'
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
    } else if (event.type === ProofEventTypes.ProofStateChanged) {
      return {
        success: true,
        id: event.payload.proofRecord.id,
        type: 'proofExchange',
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
      success: false,
      error: 'Invalid invitation.',
    }
  }

  return {
    success: false,
    error: 'Invalid invitation.',
  }
}
