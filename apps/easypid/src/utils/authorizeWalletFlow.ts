import {
  clearWalletServiceProviderPin,
  setWalletServiceProviderPin,
  validateWalletPin,
} from '@easypid/crypto/WalletServiceProviderClient'
import type { SubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationError,
  secureWalletKey,
} from '@paradym/wallet-sdk'

const walletFlowAuthorizationRoutes = ['/notifications/openIdPresentation', '/notifications/openIdCredential'] as const
type WalletFlowAuthorizationRoute = (typeof walletFlowAuthorizationRoutes)[number]

let redirectedWalletFlowAuthorizationRoute: WalletFlowAuthorizationRoute | undefined

export const getRedirectedWalletFlowAuthorizationRoute = (redirectUrl?: string, shouldUseCloudHsm?: boolean) => {
  if (!redirectUrl || !shouldUseCloudHsm) return undefined

  const pathname = new URL(redirectUrl, 'paradym-wallet://wallet').pathname
  return walletFlowAuthorizationRoutes.find((route) => route === pathname)
}

export const setWalletFlowAuthorizationSession = (route: WalletFlowAuthorizationRoute) => {
  redirectedWalletFlowAuthorizationRoute = route
}

const consumeWalletFlowAuthorizationSession = (
  route: WalletFlowAuthorizationRoute,
  mode: SubmissionAuthorizationMode
) => {
  if (!redirectedWalletFlowAuthorizationRoute) return false

  const isMatch = redirectedWalletFlowAuthorizationRoute === route && mode === 'pin-only'
  redirectedWalletFlowAuthorizationRoute = undefined

  if (!isMatch) clearWalletServiceProviderPin()

  return isMatch
}

export const clearWalletFlowAuthorization = () => {
  clearWalletServiceProviderPin()
  redirectedWalletFlowAuthorizationRoute = undefined
}

export const isWalletAuthPromptError = (error: unknown) =>
  error instanceof ParadymWalletAuthenticationInvalidPinError ||
  error instanceof ParadymWalletBiometricAuthenticationError

export const authorizeWalletFlow = async ({
  mode,
  pin,
}: {
  mode: Exclude<SubmissionAuthorizationMode, 'none'>
  pin?: string
}) => {
  if (mode === 'pin-only') {
    if (!pin) throw new Error('PIN is required to authorize this flow')
    await setWalletServiceProviderPin(pin)
    return
  }

  if (pin) return validateWalletPin(pin)

  const walletKey = await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
  if (!walletKey) throw new Error('Biometric authentication failed')
}

export const authorizeWalletFlowIfNeeded = async ({
  mode,
  pin,
  route,
}: {
  mode?: SubmissionAuthorizationMode
  pin?: string
  route?: WalletFlowAuthorizationRoute
}) => {
  if (!mode || mode === 'none') return
  if (route && consumeWalletFlowAuthorizationSession(route, mode)) return

  await authorizeWalletFlow({ mode, pin })
}
