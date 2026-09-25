import { t } from '@lingui/core/macro'
import { commonMessages } from '@package/translations'
import type { DcApiRegisterCredentialsOptions, ParadymWalletSdk, ResolveDcApiDisplay } from '@paradym/wallet-sdk'

/**
 * What the OS credential picker shows for a credential.
 *
 * Handed to the SDK at setup so its own flows can register a credential without the app in the
 * middle — receiving one over OpenID4VCI stores and registers it in one go. A function because
 * these are translated and the user can change language while the wallet is open.
 */
export const resolveDcApiDisplay: ResolveDcApiDisplay = () => ({
  displaySubtitle: (issuerName: string) => t(commonMessages.issuedByWithName(issuerName)),
  displayTitleFallback: t(commonMessages.unknown),
  displaySubtitleFallback: t(commonMessages.unknown),
})

/**
 * The same wording, for the call sites that register explicitly rather than through the SDK.
 */
export const dcApiRegisterOptions = <T extends { paradym: ParadymWalletSdk } = { paradym: ParadymWalletSdk }>(
  options: T
): DcApiRegisterCredentialsOptions & T => ({
  ...resolveDcApiDisplay(),
  ...options,
})
