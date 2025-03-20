export const APP_CONFIGS = {
  FUNKE_WALLET: {
    EID_CARD: true,
    AI_ANALYSIS: true,
    DIDCOMM: false,
    CLOUD_HSM: true,
    INBOX: false,
  },
  PARADYM_WALLET: {
    EID_CARD: false,
    AI_ANALYSIS: false,
    DIDCOMM: true,
    CLOUD_HSM: false,
    INBOX: true,
  },
} satisfies Record<string, Features>

export interface Features {
  EID_CARD: boolean
  AI_ANALYSIS: boolean
  DIDCOMM: boolean
  CLOUD_HSM: boolean
  INBOX: boolean
}

export type FeatureKey = keyof Features
