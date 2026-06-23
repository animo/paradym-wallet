import { t } from '@lingui/core/macro'
import { commonMessages } from '@package/translations'
import type { DcApiRegisterCredentialsOptions, ParadymWalletSdk } from '@paradym/wallet-sdk'

export const dcApiRegisterOptions = <T extends { paradym: ParadymWalletSdk } = { paradym: ParadymWalletSdk }>(
  options: T
): DcApiRegisterCredentialsOptions & T => ({
  displaySubtitle: (issuerName: string) => t(commonMessages.issuedByWithName(issuerName)),
  displayTitleFallback: t(commonMessages.unknown),
  displaySubtitleFallback: t(commonMessages.unknown),
  ...options,
})
