export const APP_CONFIGS = {
  FUNKE_WALLET: {
    EID_CARD: true,
    AI_ANALYSIS: true,
    DIDCOMM: false,
  },
  PARADYM_WALLET: {
    EID_CARD: false,
    AI_ANALYSIS: false,
    DIDCOMM: true,
  },
} satisfies Record<string, Features>

export interface Features {
  EID_CARD: boolean
  AI_ANALYSIS: boolean
  DIDCOMM: boolean
}

export type FeatureKey = keyof Features
