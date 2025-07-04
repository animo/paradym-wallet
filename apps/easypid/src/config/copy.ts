import { useAssets } from 'expo-asset'
import { type AppType, CURRENT_APP_TYPE } from './appType'

export const copy = {
  FUNKE_WALLET: {
    about: {
      description:
        'This app was created by Animo Solutions in the context of the SPRIN-D Funke ‘EUDI Wallet Prototypes’. It serves as a prototype for future wallet providers. All code is available under Apache 2.0.',
      emailHeader: 'Reach out from Funke EUDI Wallet',
    },
  },
  PARADYM_WALLET: {
    about: {
      description:
        'This app was created by Animo Solutions as a companion app for Paradym. All code is available under Apache 2.0.',
      emailHeader: 'Reach out from Paradym Wallet',
    },
  },
} satisfies Record<AppType, Record<string, unknown>>

export function useAppCopy() {
  return copy[CURRENT_APP_TYPE]
}

export function useAppIcon() {
  const [assets] = useAssets([require('../../assets/funke/icon.png'), require('../../assets/paradym/icon.png')])
  if (CURRENT_APP_TYPE === 'FUNKE_WALLET') {
    return assets?.[0]
  }
  return assets?.[1]
}
