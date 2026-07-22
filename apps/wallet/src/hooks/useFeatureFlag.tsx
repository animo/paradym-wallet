// translations not needed
import type { FeatureKey } from '../config/features'
import { FEATURES } from '../config/features'

export const useFeatureFlag = (featureKey: FeatureKey) => {
  return FEATURES[featureKey]
}
