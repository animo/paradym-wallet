export const FEATURES = {
  AI_ANALYSIS: false,
  DIDCOMM: true,
  CLOUD_HSM: false,
} satisfies Features

export interface Features {
  AI_ANALYSIS: boolean
  DIDCOMM: boolean
  CLOUD_HSM: boolean
}

export type FeatureKey = keyof Features
