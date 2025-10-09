import tamaguiConfig from '../../tamagui.config'
import {Provider} from '@package/app'
import { ParadymWalletSdk } from '@package/sdk'
import { SystemBars } from 'react-native-edge-to-edge'
import { paradymWalletSdkOptions } from '../paradymWalletSdkOptions'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '/(app)/index',
}


export default function RootLayout() {
  return (
    <Provider config={tamaguiConfig}>
      <SystemBars style="dark" />
      <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
        <ThemeProvider
          value={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: 'white',
            },
          }}
        >
              <Slot />
        </ThemeProvider>
      </ParadymWalletSdk.UnlockProvider>
    </Provider>
  )
}
