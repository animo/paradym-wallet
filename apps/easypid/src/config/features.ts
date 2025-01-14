export const APP_CONFIGS = {
  FUNKE_WALLET: {
    EID_CARD: true,
    AI_ANALYSIS: true,
  },
  PARADYM_WALLET: {
    EID_CARD: false,
    AI_ANALYSIS: false,
  },
} satisfies Record<string, Features>

export interface Features {
  EID_CARD: boolean
  AI_ANALYSIS: boolean
}

export type FeatureKey = keyof Features
