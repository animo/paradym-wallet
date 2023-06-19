import type { AppAgent } from './agent'
import type {
  JwkDidCreateOptions,
  KeyDidCreateOptions,
  Agent,
  W3cCredentialRecord,
} from '@aries-framework/core'

import { DidJwk, DidKey, JwaSignatureAlgorithm } from '@aries-framework/core'
import { W3cCredentialRepository } from '@aries-framework/core/build/modules/vc/repository'
import { OpenIdCredentialFormatProfile } from '@internal/openid4vc-client'

import { dbcPresentationDefinition } from './presentations/fixtures'

export enum QrTypes {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance://',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer://',
  OPENID = 'openid://',
}

export const isOpenIdCredentialOffer = (url: string) => {
  return (
    url.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE) ||
    url.startsWith(QrTypes.OPENID_CREDENTIAL_OFFER)
  )
}

export const isOpenIdPresentationRequest = (url: string) => {
  return url.startsWith(QrTypes.OPENID)
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
        supportsAllDidMethods || supportedDidMethods.includes('did:jwk')
          ? 'jwk'
          : supportedDidMethods.includes('did:key')
          ? 'key'
          : undefined

      if (!didMethod) {
        throw new Error(
          `No supported did method could be found. Supported methods are did:key and did:jwk. Issuer supports ${supportedDidMethods.join(
            ', '
          )}`
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
      JwaSignatureAlgorithm.EdDSA,
      JwaSignatureAlgorithm.ES256,
    ],
  })

  if (!records || !records.length)
    throw new Error('Error storing credential using pre authorized flow.')

  return records[0]
}

export const parsePresentationFromOpenId = async ({ data }: { data: string }) => {
  if (!data.startsWith(QrTypes.OPENID)) throw new Error('URI does not start with OpenID prefix.')

  // TODO: Handle implementation with SIOP library
  return await Promise.resolve(dbcPresentationDefinition)
}

export async function storeCredential(agent: Agent, w3cCredentialRecord: W3cCredentialRecord) {
  const w3cCredentialRepository = agent.dependencyManager.resolve(W3cCredentialRepository)

  await w3cCredentialRepository.save(agent.context, w3cCredentialRecord)
}
