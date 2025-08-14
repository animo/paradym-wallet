import { type ParadymState, useParadym } from '@paradym/wallet-sdk/hooks/useParadym'
import { isDevelopmentBuild, registerDevMenuItems } from 'expo-dev-client'
import { useCallback, useEffect } from 'react'
import { DevSettings } from 'react-native'
import { resetWallet } from '../utils/resetWallet'

export function useResetWalletDevMenu(additionalResetCb?: (paradym: ParadymState) => Promise<void> | void) {
  const paradym = useParadym()

  const reset = useCallback(() => resetWallet(paradym, additionalResetCb), [paradym, additionalResetCb])

  useEffect(() => {
    if (!isDevelopmentBuild()) return
    registerDevMenuItems([
      {
        name: 'Reset Wallet',
        callback: () =>
          reset()
            .then(() => DevSettings.reload('Wallet Reset'))
            .catch((error) => console.error('error resetting wallet', error)),
      },
    ])
  }, [reset])
}
