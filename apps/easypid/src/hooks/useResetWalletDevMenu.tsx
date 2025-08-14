import { removeHasFinishedOnboarding, removeHasSeenIntroTooltip } from '@easypid/features/onboarding'
import { removeShouldUseCloudHsm } from '@easypid/features/onboarding/useShouldUseCloudHsm'
import { useResetWalletDevMenu as useResetWalletDevMenuSdk } from '@paradym/wallet-sdk/hooks'

export const additionalResetApp = () => {
  removeHasFinishedOnboarding()
  removeHasSeenIntroTooltip()
  removeShouldUseCloudHsm()
}

export const useResetWalletDevMenu = () => useResetWalletDevMenuSdk(() => {})
