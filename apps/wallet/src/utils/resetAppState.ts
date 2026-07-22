import { removeHasFinishedOnboarding, removeHasSeenIntroTooltip } from '@app/features/onboarding'
import { removeShouldUseCloudHsm } from '@app/features/onboarding/useShouldUseCloudHsm'

export const resetAppState = () => {
  removeHasFinishedOnboarding()
  removeHasSeenIntroTooltip()
  removeShouldUseCloudHsm()
}
