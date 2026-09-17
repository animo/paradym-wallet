import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
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

// `'x' in options` is true for an explicitly-undefined property, so a caller spreading an
// optional value (e.g. `transactionCode: txCode` where `txCode` is undefined for a plain
// pre-auth offer) would otherwise be routed to the wrong flow. Discriminate on the value.
export const acquireCredentials = async (options: AcquireCredentialsOptions) => {
  if ('transactionCode' in options && options.transactionCode !== undefined) {
    return await acquireCredentialsPreAuthWithTransactionCode(options)
  }

  if ('credentialsForRequest' in options && options.credentialsForRequest !== undefined) {
    return await acquireCredentialsAuthPresentationDuringIssuance(options)
  }

  if ('authorizationCode' in options && options.authorizationCode !== undefined) {
    return await acquireCredentialsAuth(options)
  }

  return await acquireCredentialsPreAuth(options)
}
