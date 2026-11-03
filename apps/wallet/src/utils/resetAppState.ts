import { removeHasFinishedOnboarding, removeHasSeenIntroTooltip } from '@app/features/onboarding'

export const resetAppState = () => {
  removeHasFinishedOnboarding()
  removeHasSeenIntroTooltip()
}
