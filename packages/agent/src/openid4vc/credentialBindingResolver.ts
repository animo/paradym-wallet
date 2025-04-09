import {
  DidJwk,
  DidKey,
  DidsApi,
  type JwkDidCreateOptions,
  KeyBackend,
  type KeyDidCreateOptions,
  getJwkFromKey,
} from '@credo-ts/core'
import { type OpenId4VciCredentialBindingResolver, OpenId4VciCredentialFormatProfile } from '@credo-ts/openid4vc'

export function getCredentialBindingResolver({
  pidSchemes,
  requestBatch,
}: {
  pidSchemes?: { sdJwtVcVcts: Array<string>; msoMdocDoctypes: Array<string> }
  requestBatch?: boolean | number
}): OpenId4VciCredentialBindingResolver {
  return async ({
    supportedDidMethods,
    credentialConfiguration,
    issuerMaxBatchSize,
    proofTypes,
    supportsAllDidMethods,
    supportsJwk,
    credentialFormat,
    agentContext,
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

    const shouldKeyBeHardwareBackedForMsoMdoc =
      credentialConfiguration?.format === OpenId4VciCredentialFormatProfile.MsoMdoc &&
      pidSchemes?.msoMdocDoctypes.includes(credentialConfiguration.doctype)

    const shouldKeyBeHardwareBackedForSdJwtVc =
      (credentialConfiguration?.format === 'vc+sd-jwt' || credentialConfiguration.format === 'dc+sd-jwt') &&
      pidSchemes?.sdJwtVcVcts.includes(credentialConfiguration.vct)

    const shouldKeyBeHardwareBacked = shouldKeyBeHardwareBackedForSdJwtVc || shouldKeyBeHardwareBackedForMsoMdoc

    // We don't want to request more than 10 credentials
    const batchSize =
      requestBatch === true
        ? Math.min(issuerMaxBatchSize, 10)
        : typeof requestBatch === 'number'
          ? Math.min(issuerMaxBatchSize, requestBatch)
          : 1

    // TODO: support key attestations
    if (!proofTypes.jwt || proofTypes.jwt.keyAttestationsRequired) {
      throw new Error('Unable to request credentials. Only jwt proof type without key attestations supported')
    }

    const keyType = proofTypes.jwt.supportedKeyTypes[0]
    const keys = await Promise.all(
      new Array(batchSize).fill(0).map(() =>
        agentContext.wallet.createKey({
          keyType,
          keyBackend: shouldKeyBeHardwareBacked ? KeyBackend.SecureElement : KeyBackend.Software,
        })
      )
    )

    if (didMethod) {
      const dm = didMethod
      const didsApi = agentContext.dependencyManager.resolve(DidsApi)
      const didResults = await Promise.all(
        keys.map(async (key) => {
          const didResult = await didsApi.create<JwkDidCreateOptions | KeyDidCreateOptions>({
            method: dm,
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
            key,
          } as const
        })
      )
    }

    // Otherwise we also support plain jwk for sd-jwt only
    if (
      supportsJwk &&
      (credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc ||
        credentialFormat === OpenId4VciCredentialFormatProfile.MsoMdoc)
    ) {
      return {
        method: 'jwk',
        keys: keys.map((key) => getJwkFromKey(key)),
      }
    }

    throw new Error(
      `No supported binding method could be found. Supported methods are did:key and did:jwk, or plain jwk for sd-jwt/mdoc. Issuer supports ${
        supportsJwk ? 'jwk, ' : ''
      }${supportedDidMethods?.join(', ') ?? 'Unknown'}`
    )
  }
}
