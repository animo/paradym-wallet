import {
  DidJwk,
  DidKey,
  DidsApi,
  type JwkDidCreateOptions,
  KeyBackend,
  type KeyDidCreateOptions,
  getJwkFromKey,
} from '@credo-ts/core'
import {
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialBindingResolver,
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  type OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'

export function getCredentialBindingResolver({
  pidSchemes,
  resolvedCredentialOffer,
}: {
  pidSchemes?: { sdJwtVcVcts: Array<string>; msoMdocDoctypes: Array<string> }
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
}): OpenId4VciCredentialBindingResolver {
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

    const key = await agentContext.wallet.createKey({
      keyType: keyTypes[0],
      keyBackend: shouldKeyBeHardwareBacked ? KeyBackend.SecureElement : KeyBackend.Software,
    })

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
