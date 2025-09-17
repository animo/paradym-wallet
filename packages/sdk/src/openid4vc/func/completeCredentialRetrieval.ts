import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { getCredentialDisplayWithDefaults } from '@paradym/wallet-sdk/display/common'
import { getCredentialForDisplayId } from '@paradym/wallet-sdk/display/credential'
import { getOpenId4VcCredentialDisplay } from '@paradym/wallet-sdk/display/openid4vc'
import { extractOpenId4VcCredentialMetadata } from '@paradym/wallet-sdk/metadata/credentials'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { addReceivedActivity } from '../../storage/activities'
import { type CredentialRecord, storeCredential } from '../../storage/credentials'

export type CompleteCredentialRetrievalOptions = {
  paradym: ParadymWalletSdk
  record: CredentialRecord
  resolvedCredentialOffer?: OpenId4VciResolvedCredentialOffer
}

export const completeCredentialRetrieval = async (options: CompleteCredentialRetrievalOptions) => {
  const credentialDisplayId = getCredentialForDisplayId(options.record)

  // We want the first supported configuration id
  // TODO(sdk): handle empty configuration ids
  const configurationId = options.resolvedCredentialOffer?.offeredCredentialConfigurations
    ? Object.keys(options.resolvedCredentialOffer.offeredCredentialConfigurations)[0]
    : undefined
  const configuration = configurationId
    ? options.resolvedCredentialOffer?.offeredCredentialConfigurations[configurationId]
    : undefined

  const issuerMetadata = options.resolvedCredentialOffer?.metadata.credentialIssuer

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

  await storeCredential(options.paradym, options.record)
  await addReceivedActivity(options.paradym, {
    // FIXME: Should probably be the `iss`, but then we can't show it before we retrieved
    // the credential. Signed issuer metadata is the solution.
    entityId: options.resolvedCredentialOffer?.metadata.credentialIssuer.credential_issuer,
    host: credentialDisplay.issuer.domain,
    name: credentialDisplay.issuer.name,
    logo: credentialDisplay.issuer.logo,
    backgroundColor: '#ffffff', // Default to a white background for now
    credentialIds: [credentialDisplayId],
  })
}
