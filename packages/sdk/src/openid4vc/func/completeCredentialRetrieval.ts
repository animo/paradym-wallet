import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { getOpenId4VcCredentialDisplay } from '@paradym/wallet-sdk/display/openid4vc'
import { extractOpenId4VcCredentialMetadata } from '@paradym/wallet-sdk/metadata/credentials'
import {
  type DeferredCredentialBefore,
  storeDeferredCredential,
} from '@paradym/wallet-sdk/storage/deferredCredentialStore'
import { getCredentialDisplayWithDefaults } from '../../display/common'
import { getCredentialForDisplayId } from '../../display/credential'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { storeReceivedActivity } from '../../storage/activityStore'
import { type CredentialRecord, storeCredential } from '../../storage/credentials'

export type CompleteCredentialRetrievalOptions = {
  paradym: ParadymWalletSdk
  record?: CredentialRecord
  deferredCredential?: DeferredCredentialBefore
  resolvedCredentialOffer?: OpenId4VciResolvedCredentialOffer
}

export const completeCredentialRetrieval = async (options: CompleteCredentialRetrievalOptions) => {
  if (!options.record && !options.deferredCredential) {
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

  if (options.record) {
    await storeCredential(options.paradym, options.record)
  }

  await storeReceivedActivity(options.paradym, {
    // FIXME: Should probably be the `iss`, but then we can't show it before we retrieved
    // the credential. Signed issuer metadata is the solution.
    entityId: options.resolvedCredentialOffer?.metadata.credentialIssuer.credential_issuer,
    host: credentialDisplay.issuer.domain,
    name: credentialDisplay.issuer.name,
    logo: credentialDisplay.issuer.logo,
    backgroundColor: '#ffffff', // Default to a white background for now
    credentialIds: options.record ? [getCredentialForDisplayId(options.record)] : [],
    deferredCredentials: [credentialDisplay],
  })
}
