import { removeHasFinishedOnboarding, removeHasSeenIntroTooltip } from '@easypid/features/onboarding'
import { removeShouldUseCloudHsm } from '@easypid/features/onboarding/useShouldUseCloudHsm'

export const resetAppState = () => {
  removeHasFinishedOnboarding()
  removeHasSeenIntroTooltip()
  removeShouldUseCloudHsm()
}
