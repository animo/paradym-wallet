import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { getCredentialDisplayWithDefaults } from '@paradym/wallet-sdk/display/common'
import { getOpenId4VcCredentialDisplay } from '@paradym/wallet-sdk/display/openid4vc'
import { extractOpenId4VcCredentialMetadata } from '@paradym/wallet-sdk/metadata/credentials'

export const getCredentialDisplay = (resolvedCredentialOffer?: OpenId4VciResolvedCredentialOffer) => {
  // TODO: where to transform?
  // Combine oid4vci issuer metadata and openid fed into one pipeline. If openid it's trusted
  const issuerMetadata = resolvedCredentialOffer?.metadata.credentialIssuer
  // We want the first supported configuration id
  // TODO: handle empty configuration ids
  const configurationId = resolvedCredentialOffer?.offeredCredentialConfigurations
    ? Object.keys(resolvedCredentialOffer.offeredCredentialConfigurations)[0]
    : undefined
  const configuration = configurationId
    ? resolvedCredentialOffer?.offeredCredentialConfigurations[configurationId]
    : undefined

  const credentialDisplay = getCredentialDisplayWithDefaults(
    configuration && issuerMetadata
      ? getOpenId4VcCredentialDisplay(
          extractOpenId4VcCredentialMetadata(configuration, {
            display: issuerMetadata?.display,
            id: issuerMetadata?.credential_issuer,
          })
        )
      : {}
  )

  return credentialDisplay
}
