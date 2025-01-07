import { APP_CONFIGS } from '../config/features'
import type { AppType, FeatureKey } from '../config/features'

const APP_TYPE = (process.env.EXPO_PUBLIC_APP_TYPE || 'PARADYM_WALLET') as AppType

export const useFeatureFlag = (featureKey: FeatureKey) => {
  return APP_CONFIGS[APP_TYPE]?.[featureKey] ?? false
}
