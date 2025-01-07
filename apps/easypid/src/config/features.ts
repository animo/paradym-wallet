export const FEATURES = {
  EID_CARD_FEATURE: 'eid_card_feature',
  AI_ANALYSIS_FEATURE: 'ai_analysis_feature',
}

export const APP_CONFIGS = {
  FUNKE_WALLET: {
    [FEATURES.EID_CARD_FEATURE]: true,
    [FEATURES.AI_ANALYSIS_FEATURE]: true,
  },
  PARADYM_WALLET: {
    [FEATURES.EID_CARD_FEATURE]: false,
    [FEATURES.AI_ANALYSIS_FEATURE]: false,
  },
}

export type AppType = keyof typeof APP_CONFIGS
export type FeatureKey = keyof (typeof APP_CONFIGS)[AppType]
