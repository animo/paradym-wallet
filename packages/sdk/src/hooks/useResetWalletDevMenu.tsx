// import { useParadym } from '@paradym/wallet-sdk/hooks/useParadym'
// import { isDevelopmentBuild, registerDevMenuItems } from 'expo-dev-client'
// import { useCallback, useEffect } from 'react'
// import { DevSettings } from 'react-native'

export function useResetWalletDevMenu() {
  //   const paradym = useParadym()
  //
  //   const reset = useCallback(() => {
  //     if (paradym.state === 'unlocked') {
  //       paradym.reset()
  //     }
  //     if (paradym.state !== 'initializing') {
  //       paradym.reinitialize()
  //     }
  //   }, [paradym])
  //
  //   useEffect(() => {
  //     if (!isDevelopmentBuild()) return
  //     registerDevMenuItems([
  //       {
  //         name: 'Reset Wallet',
  //         callback: () => {
  //           reset()
  //           DevSettings.reload('Wallet Reset')
  //         },
  //       },
  //     ])
  //   }, [reset])
}
