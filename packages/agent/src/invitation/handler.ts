import type {
  ConnectionRecord,
  CredentialStateChangedEvent,
  DifPexCredentialsForRequest,
  JwkDidCreateOptions,
  Key,
  KeyDidCreateOptions,
  OutOfBandInvitation,
  OutOfBandRecord,
  ProofStateChangedEvent,
} from '@credo-ts/core'
import type { PlaintextMessage } from '@credo-ts/core/build/types'
import type {
  OpenId4VcSiopVerifiedAuthorizationRequest,
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciResolvedAuthorizationRequestWithCode,
  OpenId4VciResolvedCredentialOffer,
  OpenId4VciTokenRequestOptions,
} from '@credo-ts/openid4vc'
import { Platform } from 'react-native'
import type { EitherAgent, FullAppAgent } from '../agent'

import { V1OfferCredentialMessage, V1RequestPresentationMessage } from '@credo-ts/anoncreds'
import {
  CredentialEventTypes,
  CredentialState,
  DidJwk,
  DidKey,
  JwaSignatureAlgorithm,
  KeyBackend,
  KeyType,
  OutOfBandRepository,
  ProofEventTypes,
  ProofState,
  SdJwtVcRecord,
  SdJwtVcRepository,
  V2OfferCredentialMessage,
  V2RequestPresentationMessage,
  W3cCredentialRecord,
  W3cCredentialRepository,
  getJwkFromKey,
  parseMessageType,
} from '@credo-ts/core'
import { supportsIncomingMessageType } from '@credo-ts/core/build/utils/messageType'
import { OpenId4VciCredentialFormatProfile } from '@credo-ts/openid4vc'
import { getHostNameFromUrl } from '@package/utils'
import { filter, first, firstValueFrom, merge, timeout } from 'rxjs'

import type { AppAgent } from '@easypid/agent'
import { extractOpenId4VcCredentialMetadata, setOpenId4VcCredentialMetadata } from '../openid4vc/metadata'

export async function resolveOpenId4VciOffer({
  agent,
  offer,
  authorization,
}: {
  agent: EitherAgent
  offer: { data?: string; uri?: string }
  authorization?: { clientId: string; redirectUri: string }
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
  if (resolvedCredentialOffer.credentialOfferPayload.grants?.authorization_code) {
    // If only authorization_code grant is valid and user didn't provide authorization details we can't continue
    if (
      !resolvedCredentialOffer.credentialOfferPayload.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code'] &&
      !authorization
    ) {
      throw new Error(
        "Missing 'authorization' parameter with 'clientId' and 'redirectUri' and authorization code flow is only allowed grant type on offer."
      )
    }

    const uniqueScopes = Array.from(
      new Set(
        resolvedCredentialOffer.offeredCredentials.map((o) => o.scope).filter((s): s is string => s !== undefined)
      )
    )

    if (authorization) {
      resolvedAuthorizationRequest = await agent.modules.openId4VcHolder.resolveIssuanceAuthorizationRequest(
        resolvedCredentialOffer,
        {
          scope: uniqueScopes,
          redirectUri: authorization.redirectUri,
          clientId: authorization.clientId,
        }
      )
    }
  }

  return {
    resolvedCredentialOffer,
    resolvedAuthorizationRequest,
  }
}

export async function acquireAccessToken({
  resolvedCredentialOffer,
  agent,
  resolvedAuthorizationRequest,
}: {
  agent: EitherAgent
  resolvedAuthorizationRequest?: OpenId4VciResolvedAuthorizationRequestWithCode
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
}) {
  let tokenOptions: OpenId4VciTokenRequestOptions = {
    resolvedCredentialOffer,
  }

  if (resolvedAuthorizationRequest) {
    tokenOptions = {
      resolvedAuthorizationRequest,
      resolvedCredentialOffer,
      code: resolvedAuthorizationRequest.code,
    }
  }

  return await agent.modules.openId4VcHolder.requestToken(tokenOptions)
}

export const receiveCredentialFromOpenId4VciOfferAuthenticatedChannel = async ({
  agent,
  resolvedCredentialOffer,
  credentialConfigurationIdToRequest,
  accessToken,
  clientId,
  pidSchemes,
  deviceKey,
  pinDerivedEphKeyPop,
  pinDerivedEph,
}: {
  agent: AppAgent
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  credentialConfigurationIdToRequest?: string
  clientId?: string
  pidSchemes?: { sdJwtVcVcts: Array<string>; msoMdocNamespaces: Array<string> }
  deviceKey: Key
  pinDerivedEphKeyPop: string
  pinDerivedEph: Key

  // TODO: cNonce should maybe be provided separately (multiple calls can have different c_nonce values)
  accessToken: OpenId4VciRequestTokenResponse
}) => {
  // By default request the first offered credential
  // TODO: extract the first supported offered credential
  const offeredCredentialToRequest = credentialConfigurationIdToRequest
    ? resolvedCredentialOffer.offeredCredentials.find((offered) => offered.id === credentialConfigurationIdToRequest)
    : resolvedCredentialOffer.offeredCredentials[0]
  if (!offeredCredentialToRequest) {
    throw new Error(
      `Parameter 'credentialConfigurationIdToRequest' with value ${credentialConfigurationIdToRequest} is not a credential_configuration_id in the credential offer.`
    )
  }

  // FIXME: return credential_supported entry for credential so it's easy to store metadata
  const credentials = await agent.modules.openId4VcHolder.requestCredentials({
    resolvedCredentialOffer,
    ...accessToken,
    customFormat: 'seed_credential',
    additionalCredentialRequestPayloadClaims: {
      pin_derived_eph_key_pop: pinDerivedEphKeyPop,
    },
    additionalProofOfPossessionPayloadClaims: {
      pin_derived_eph_pub: getJwkFromKey(pinDerivedEph).toJson(),
    },

    clientId,
    credentialsToRequest: [offeredCredentialToRequest.id],
    verifyCredentialStatus: false,
    allowedProofOfPossessionSignatureAlgorithms: [
      // NOTE: MATTR launchpad for JFF MUST use EdDSA. So it is important that the default (first allowed one)
      // is EdDSA. The list is ordered by preference, so if no suites are defined by the issuer, the first one
      // will be used
      JwaSignatureAlgorithm.EdDSA,
      JwaSignatureAlgorithm.ES256,
    ],
    credentialBindingResolver: async ({ keyType, supportsJwk }) => {
      if (!supportsJwk) {
        throw Error('Issuer does not support JWK')
      }

      if (keyType !== KeyType.P256) {
        throw new Error(`invalid key type used '${keyType}' and only  ${KeyType.P256} is allowed.`)
      }
      return {
        method: 'jwk',
        jwk: getJwkFromKey(deviceKey),
      }
    },
  })

  console.log('TODO: store seed credential')
  console.log(JSON.stringify(credentials, null, 2))

  const record: SdJwtVcRecord = new SdJwtVcRecord({ compactSdJwtVc: 'todo' })
  return record
}

export const receiveCredentialFromOpenId4VciOffer = async ({
  agent,
  resolvedCredentialOffer,
  credentialConfigurationIdToRequest,
  accessToken,
  clientId,
  pidSchemes,
}: {
  agent: EitherAgent
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  credentialConfigurationIdToRequest?: string
  clientId?: string
  pidSchemes?: { sdJwtVcVcts: Array<string>; msoMdocNamespaces: Array<string> }

  // TODO: cNonce should maybe be provided separately (multiple calls can have different c_nonce values)
  accessToken: OpenId4VciRequestTokenResponse
}) => {
  // By default request the first offered credential
  // TODO: extract the first supported offered credential
  const offeredCredentialToRequest = credentialConfigurationIdToRequest
    ? resolvedCredentialOffer.offeredCredentials.find((offered) => offered.id === credentialConfigurationIdToRequest)
    : resolvedCredentialOffer.offeredCredentials[0]
  if (!offeredCredentialToRequest) {
    throw new Error(
      `Parameter 'credentialConfigurationIdToRequest' with value ${credentialConfigurationIdToRequest} is not a credential_configuration_id in the credential offer.`
    )
  }

  // FIXME: return credential_supported entry for credential so it's easy to store metadata
  const credentials = await agent.modules.openId4VcHolder.requestCredentials({
    resolvedCredentialOffer,
    ...accessToken,
    clientId,
    credentialsToRequest: [offeredCredentialToRequest.id],
    verifyCredentialStatus: false,
    allowedProofOfPossessionSignatureAlgorithms: [
      // NOTE: MATTR launchpad for JFF MUST use EdDSA. So it is important that the default (first allowed one)
      // is EdDSA. The list is ordered by preference, so if no suites are defined by the issuer, the first one
      // will be used
      JwaSignatureAlgorithm.EdDSA,
      JwaSignatureAlgorithm.ES256,
    ],
    credentialBindingResolver: async ({
      supportedDidMethods,
      keyType,
      supportsAllDidMethods,
      supportsJwk,
      credentialFormat,
      supportedCredentialId,
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

      const offeredCredentialConfiguration = supportedCredentialId
        ? resolvedCredentialOffer.offeredCredentialConfigurations[supportedCredentialId]
        : undefined

      const shouldKeyBeHardwareBackedForMsoMdoc = false
      //   offeredCredentialConfiguration?.format === "mso_mdoc" &&
      //   pidSchemes?.msoMdocNamespaces.includes(
      //     offeredCredentialConfiguration.namespace
      //   );
      const shouldKeyBeHardwareBackedForSdJwtVc =
        offeredCredentialConfiguration?.format === 'vc+sd-jwt' &&
        pidSchemes?.sdJwtVcVcts.includes(offeredCredentialConfiguration.vct)

      // TODO: add mso-mdoc config from above
      const shouldKeyBeHardwareBacked = shouldKeyBeHardwareBackedForSdJwtVc || shouldKeyBeHardwareBackedForMsoMdoc

      const key = await agent.wallet.createKey({
        keyType,
        keyBackend: shouldKeyBeHardwareBacked ? KeyBackend.SecureElement : KeyBackend.Software,
      })

      if (didMethod) {
        const didResult = await agent.dids.create<JwkDidCreateOptions | KeyDidCreateOptions>({
          method: didMethod,
          options: {
            key,
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
  })

  const [firstCredential] = credentials
  if (!firstCredential) throw new Error('Error retrieving credential.')

  let record: SdJwtVcRecord | W3cCredentialRecord

  // TODO: add claimFormat to SdJwtVc
  if ('compact' in firstCredential.credential) {
    record = new SdJwtVcRecord({
      compactSdJwtVc: firstCredential.credential.compact,
    })
  } else {
    record = new W3cCredentialRecord({
      credential: firstCredential.credential,
      // We don't support expanded types right now, but would become problem when we support JSON-LD
      tags: {},
    })
  }

  const openId4VcMetadata = extractOpenId4VcCredentialMetadata(offeredCredentialToRequest, {
    id: resolvedCredentialOffer.metadata.issuer,
    display: resolvedCredentialOffer.metadata.credentialIssuerMetadata.display,
  })

  setOpenId4VcCredentialMetadata(record, openId4VcMetadata)

  return record
}

export const getCredentialsForProofRequest = async ({
  agent,
  data,
  uri,
}: {
  agent: EitherAgent
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
  selectedCredentials,
}: {
  agent: EitherAgent
  authorizationRequest: OpenId4VcSiopVerifiedAuthorizationRequest
  credentialsForRequest: DifPexCredentialsForRequest
  selectedCredentials: { [inputDescriptorId: string]: string }
}) => {
  if (!credentialsForRequest.areRequirementsSatisfied) {
    throw new Error('Requirements from proof request are not satisfied')
  }

  // Map all requirements and entries to a credential record. If a credential record for an
  // input descriptor has been provided in `selectedCredentials` we will use that. Otherwise
  // it will pick the first available credential.
  const credentials = Object.fromEntries(
    credentialsForRequest.requirements.flatMap((requirement) =>
      requirement.submissionEntry.map((entry) => {
        const credentialId = selectedCredentials[entry.inputDescriptorId]
        const credential =
          entry.verifiableCredentials.find((vc) => vc.credentialRecord.id === credentialId) ??
          entry.verifiableCredentials[0]

        return [entry.inputDescriptorId, [credential.credentialRecord]]
      })
    )
  )

  const result = await agent.modules.openId4VcHolder.acceptSiopAuthorizationRequest({
    authorizationRequest,
    presentationExchange: {
      credentials,
    },
  })

  if (result.serverResponse.status < 200 || result.serverResponse.status > 299) {
    throw new Error(`Error while accepting authorization request. ${result.serverResponse.body as string}`)
  }

  return result
}

export async function storeCredential(agent: EitherAgent, credentialRecord: W3cCredentialRecord | SdJwtVcRecord) {
  if (credentialRecord instanceof W3cCredentialRecord) {
    await agent.dependencyManager.resolve(W3cCredentialRepository).save(agent.context, credentialRecord)
  } else {
    await agent.dependencyManager.resolve(SdJwtVcRepository).save(agent.context, credentialRecord)
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
