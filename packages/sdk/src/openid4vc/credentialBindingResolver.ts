import { DidJwk, DidKey, DidsApi, type JwkDidCreateOptions, type KeyDidCreateOptions, Kms } from '@credo-ts/core'
import { type OpenId4VciCredentialBindingResolver, OpenId4VciCredentialFormatProfile } from '@credo-ts/openid4vc'
import type { ResolveCredentialKeyOptions } from '../config'

export function getCredentialBindingResolver({
  resolveCredentialKeyOptions,
  requestBatch,
}: {
  resolveCredentialKeyOptions?: ResolveCredentialKeyOptions
  requestBatch?: boolean | number
}): OpenId4VciCredentialBindingResolver {
  return async (options) => {
    const {
      supportedDidMethods,
      issuerMaxBatchSize,
      proofTypes,
      supportsAllDidMethods,
      supportsJwk,
      credentialFormat,
      agentContext,
    } = options
    const kms = agentContext.resolve(Kms.KeyManagementApi)

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

    const { supportedSignatureAlgorithms } = proofTypes.jwt
    const keyOptions = await resolveCredentialKeyOptions?.(options)

    // FIXME: what should happen with already existing keys created in the secure environment?
    const backend = keyOptions?.backend ?? 'askar'
    const signatureAlgorithm = keyOptions?.algorithm ?? supportedSignatureAlgorithms[0]
    if (!supportedSignatureAlgorithms.includes(signatureAlgorithm)) {
      throw new Error(
        `Unable to request credentials. Key algorithm '${signatureAlgorithm}' is not supported by the issuer, which supports ${supportedSignatureAlgorithms.join(', ')}`
      )
    }

    const keys = await Promise.all(
      new Array(batchSize).fill(0).map(() =>
        kms
          .createKeyForSignatureAlgorithm({
            algorithm: signatureAlgorithm,
            backend,
          })
          .then((key) => Kms.PublicJwk.fromUnknown(key.publicJwk))
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
              keyId: key.keyId,
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
            verificationMethodId = `${didKey.did}#${didKey.publicJwk.fingerprint}`
          }

          return verificationMethodId
        })
      )

      return {
        method: 'did',
        didUrls: didResults,
      }
    }

    // Otherwise we also support plain jwk for sd-jwt only
    if (
      supportsJwk &&
      (credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc ||
        credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtDc ||
        credentialFormat === OpenId4VciCredentialFormatProfile.MsoMdoc)
    ) {
      return {
        method: 'jwk',
        keys,
      }
    }

    throw new Error(
      `No supported binding method could be found. Supported methods are did:key and did:jwk, or plain jwk for sd-jwt/mdoc. Issuer supports ${
        supportsJwk ? 'jwk, ' : ''
      }${supportedDidMethods?.join(', ') ?? 'Unknown'}`
    )
  }
}
