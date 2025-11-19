import type { ParadymWalletSdk } from '@paradym/wallet-sdk/ParadymWalletSdk'
import { type AcquireCredentialsAuthOptions, acquireCredentialsAuth } from './acquireCredentialsAuth'
import {
  type AcquireCredentialsAuthPresentationDuringIssuanceOptions,
  acquireCredentialsAuthPresentationDuringIssuance,
} from './acquireCredentialsAuthPresentationDuringIssuance'
import { type AcquireCredentialsPreAuthOptions, acquireCredentialsPreAuth } from './acquireCredentialsPreAuth'
import {
  type AcquireCredentialsPreAuthWithTransactionCodeOptions,
  acquireCredentialsPreAuthWithTransactionCode,
} from './acquireCredentialsPreAuthWithTransactionCode'

export type AcquireCredentialsOptions = { paradym: ParadymWalletSdk } & (
  | AcquireCredentialsPreAuthWithTransactionCodeOptions
  | AcquireCredentialsPreAuthOptions
  | AcquireCredentialsAuthOptions
  | AcquireCredentialsAuthPresentationDuringIssuanceOptions
)

export const acquireCredentials = async (options: AcquireCredentialsOptions) => {
  if ('transactionCode' in options) {
    return await acquireCredentialsPreAuthWithTransactionCode(options)
  }

  if ('credentialsForRequest' in options) {
    return await acquireCredentialsAuthPresentationDuringIssuance(options)
  }

  if ('authorizationCode' in options) {
    return await acquireCredentialsAuth(options)
  }

  return await acquireCredentialsPreAuth(options)
}
