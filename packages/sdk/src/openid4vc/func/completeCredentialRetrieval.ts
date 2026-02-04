import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { dcApiRegisterOptions } from '@easypid/utils/dcApiRegisterOptions'
import type { DcApiRegisterCredentialsOptions } from '@paradym/wallet-sdk'
import { getCredentialDisplayWithDefaults } from '../../display/common'
import { getCredentialForDisplayId } from '../../display/credential'
import { getOpenId4VcCredentialDisplay } from '../../display/openid4vc'
import { extractOpenId4VcCredentialMetadata } from '../../metadata/credentials'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { storeReceivedActivity } from '../../storage/activityStore'
import { type CredentialRecord, storeCredential } from '../../storage/credentials'
import { type DeferredCredentialBefore, storeDeferredCredential } from '../../storage/deferredCredentialStore'

export type CompleteCredentialRetrievalOptions = {
  paradym: ParadymWalletSdk
  recordToStore?: DcApiRegisterCredentialsOptions & { credentialRecord: CredentialRecord }
  deferredCredential?: DeferredCredentialBefore
  resolvedCredentialOffer?: OpenId4VciResolvedCredentialOffer
}

export const completeCredentialRetrieval = async (options: CompleteCredentialRetrievalOptions) => {
  if (!options.recordToStore && !options.deferredCredential) {
    throw new Error('Either supply a credential record or deferred credential to complete the flow')
  }

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

  if (options.deferredCredential) {
    await storeDeferredCredential(options.paradym, options.deferredCredential)
  }

  if (options.recordToStore) {
    await storeCredential(
      dcApiRegisterOptions({ paradym: options.paradym, credentialRecord: options.recordToStore.credentialRecord })
    )
  }

  await storeReceivedActivity(options.paradym, {
    // FIXME: Should probably be the `iss`, but then we can't show it before we retrieved
    // the credential. Signed issuer metadata is the solution.
    entityId: options.resolvedCredentialOffer?.metadata.credentialIssuer.credential_issuer,
    host: credentialDisplay.issuer.domain,
    name: credentialDisplay.issuer.name,
    logo: credentialDisplay.issuer.logo,
    backgroundColor: '#ffffff', // Default to a white background for now
    credentialIds: options.recordToStore ? [getCredentialForDisplayId(options.recordToStore.credentialRecord)] : [],
    deferredCredentials: [credentialDisplay],
  })
}
