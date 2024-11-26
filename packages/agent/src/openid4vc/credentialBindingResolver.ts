import { assertAskarWallet } from '@credo-ts/askar/build/utils/assertAskarWallet'
import {
  DidJwk,
  DidKey,
  DidsApi,
  type JwkDidCreateOptions,
  Key,
  KeyBackend,
  type KeyDidCreateOptions,
  KeyType,
  TypedArrayEncoder,
  getJwkFromKey,
} from '@credo-ts/core'
import {
  type OpenId4VciCredentialBindingResolver,
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'

export function getCredentialBindingResolver({
  pidSchemes,
  resolvedCredentialOffer,
  requestBatch,
  batchCreateKeys,
}: {
  pidSchemes?: { sdJwtVcVcts: Array<string>; msoMdocDoctypes: Array<string> }
  requestBatch?: number | boolean
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  batchCreateKeys?: (count: number) => Promise<Record<string, Uint8Array>>
}): OpenId4VciCredentialBindingResolver {
  const keys: Array<Key> = []
  return async ({
    supportedDidMethods,
    keyTypes,
    supportsAllDidMethods,
    supportsJwk,
    credentialFormat,
    credentialConfigurationId,
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

    const offeredCredentialConfiguration = credentialConfigurationId
      ? (resolvedCredentialOffer.offeredCredentialConfigurations[
          credentialConfigurationId
        ] as OpenId4VciCredentialConfigurationSupportedWithFormats)
      : undefined

    const shouldKeyBeHardwareBackedForMsoMdoc =
      offeredCredentialConfiguration?.format === OpenId4VciCredentialFormatProfile.MsoMdoc &&
      pidSchemes?.msoMdocDoctypes.includes(offeredCredentialConfiguration.doctype)

    const shouldKeyBeHardwareBackedForSdJwtVc =
      offeredCredentialConfiguration?.format === 'vc+sd-jwt' &&
      pidSchemes?.sdJwtVcVcts.includes(offeredCredentialConfiguration.vct)

    const shouldKeyBeHardwareBacked = shouldKeyBeHardwareBackedForSdJwtVc || shouldKeyBeHardwareBackedForMsoMdoc

    let key: Key | undefined
    if (shouldKeyBeHardwareBacked && Number.isInteger(requestBatch)) {
      // First credential of the batch
      if (keys.length === 0) {
        const schemeCount = Object.entries(pidSchemes ?? {}).length
        const batchSize = Number(requestBatch) * schemeCount
        agentContext.config.logger.debug(`Requesting a batch of '${batchSize}' keys...`)
        const publicKeys = await batchCreateKeys?.(batchSize)
        for (const [keyId, publicKey] of Object.entries(publicKeys ?? {})) {
          const prefix = (publicKey[64] & 1) === 0 ? 0x02 : 0x03
          const compressed = new Uint8Array(33)
          compressed[0] = prefix
          compressed.set(publicKey.slice(1, 33), 1)

          const wallet = agentContext.wallet
          assertAskarWallet(wallet)
          const publicKeyBase58 = TypedArrayEncoder.toBase58(compressed)
          await wallet.withSession(async (s) =>
            s.insert({
              name: publicKeyBase58,
              category: 'SecureEnvironmentKeyRecord',
              value: JSON.stringify({
                keyId,
                publicKeyBase58,
                keyType: KeyType.P256,
              }),
              tags: {
                keyType: KeyType.P256,
              },
            })
          )

          keys.push(Key.fromPublicKey(compressed, KeyType.P256))
        }
      }

      key = keys.pop()
    } else {
      key = await agentContext.wallet.createKey({
        keyType: keyTypes[0],
        keyBackend: shouldKeyBeHardwareBacked ? KeyBackend.SecureElement : KeyBackend.Software,
      })
    }

    if (!key) {
      throw new Error('An error occurred while setting the key')
    }

    if (didMethod) {
      const didsApi = agentContext.dependencyManager.resolve(DidsApi)
      const didResult = await didsApi.create<JwkDidCreateOptions | KeyDidCreateOptions>({
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
    if (
      supportsJwk &&
      (credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc ||
        credentialFormat === OpenId4VciCredentialFormatProfile.MsoMdoc)
    ) {
      return {
        method: 'jwk',
        jwk: getJwkFromKey(key),
      }
    }

    throw new Error(
      `No supported binding method could be found. Supported methods are did:key and did:jwk, or plain jwk for sd-jwt/mdoc. Issuer supports ${
        supportsJwk ? 'jwk, ' : ''
      }${supportedDidMethods?.join(', ') ?? 'Unknown'}`
    )
  }
}
