import { defineMessage } from '@lingui/core/macro'
import { useAssets } from 'expo-asset'
import { type AppType, CURRENT_APP_TYPE } from './appType'

export const copy = {
  FUNKE_WALLET: {
    about: {
      description: defineMessage({
        id: 'funkeWallet.about.description',
        message:
          'This app was created by Animo Solutions in the context of the SPRIN-D Funke ‘EUDI Wallet Prototypes’. It serves as a prototype for future wallet providers. All code is available under Apache 2.0.',
        comment: 'About screen description text for the Funke wallet',
      }),
      emailHeader: defineMessage({
        id: 'funkeWallet.about.emailHeader',
        message: 'Reach out from Funke EUDI Wallet',
        comment: 'Email subject when contacting support from Funke wallet',
      }),
    },
  },
  DIDX_WALLET: {
    about: {
      description: defineMessage({
        id: 'didxWallet.about.description',
        message:
          'This app was created by DIDx in the context of the DFID ‘Wallet Prototype’. It serves as a prototype for future wallet providers. All code is available under Apache 2.0.',
        comment: 'About screen description text for the DIDx wallet',
      }),
      emailHeader: defineMessage({
        id: 'didxWallet.about.emailHeader',
        message: 'Reach out from DIDx DFID Wallet',
        comment: 'Email subject when contacting support from DIDx DFID wallet',
      }),
    },
  },  
  PARADYM_WALLET: {
    about: {
      description: defineMessage({
        id: 'paradymWallet.about.description',
        message:
          'This app was created by Animo Solutions as a companion app for Paradym. All code is available under Apache 2.0.',
        comment: 'About screen description text for the Paradym wallet',
      }),
      emailHeader: defineMessage({
        id: 'paradymWallet.about.emailHeader',
        message: 'Reach out from Paradym Wallet',
        comment: 'Email subject when contacting support from Paradym wallet',
      }),
    },
  },
} satisfies Record<AppType, Record<string, unknown>>

export function useAppCopy() {
  return copy[CURRENT_APP_TYPE]
}

export function useAppIcon() {
  const [assets] = useAssets([require('../../assets/funke/icon.png'), require('../../assets/didx/icon.png'), require('../../assets/paradym/icon.png')])
  if (CURRENT_APP_TYPE === 'FUNKE_WALLET') {
    return assets?.[0];
  } else if (CURRENT_APP_TYPE === 'DIDX_WALLET') {
    return assets?.[1];
  } else if (CURRENT_APP_TYPE === 'PARADYM_WALLET') {
    return assets?.[2];
  }
}