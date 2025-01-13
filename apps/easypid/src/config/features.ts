import type { AppType } from './appType'

export const APP_CONFIGS = {
  FUNKE_WALLET: {
    EID_CARD: true,
    AI_ANALYSIS: true,
  },
  PARADYM_WALLET: {
    EID_CARD: false,
    AI_ANALYSIS: false,
  },
} satisfies Record<AppType, Record<FeatureKey, boolean>>

export const FEATURES = {
  EID_CARD: 'eid_card',
  AI_ANALYSIS: 'ai_analysis',
}

export type FeatureKey = keyof typeof FEATURES
