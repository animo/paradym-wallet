export const APP_CONFIGS = {
  FUNKE_WALLET: {
    AI_ANALYSIS: true,
    DIDCOMM: false,
    CLOUD_HSM: true,
  },
  PARADYM_WALLET: {
    AI_ANALYSIS: false,
    DIDCOMM: true,
    CLOUD_HSM: false,
  },
} satisfies Record<string, Features>

export interface Features {
  AI_ANALYSIS: boolean
  DIDCOMM: boolean
  CLOUD_HSM: boolean
}

export type FeatureKey = keyof Features
