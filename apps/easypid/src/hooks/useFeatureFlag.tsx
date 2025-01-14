import { CURRENT_APP_TYPE } from '../config/appType'
import { APP_CONFIGS } from '../config/features'
import type { FeatureKey } from '../config/features'

export const useFeatureFlag = (featureKey: FeatureKey) => {
  return APP_CONFIGS[CURRENT_APP_TYPE]?.[featureKey] ?? false
}

export const useIsFunkeWallet = () => {
  return CURRENT_APP_TYPE === 'FUNKE_WALLET'
}

export const useIsParadymWallet = () => {
  return CURRENT_APP_TYPE === 'PARADYM_WALLET'
}
