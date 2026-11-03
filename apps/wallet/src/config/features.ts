export const FEATURES = {
  DIDCOMM: true,
} satisfies Features

export interface Features {
  DIDCOMM: boolean
}

export type FeatureKey = keyof Features
