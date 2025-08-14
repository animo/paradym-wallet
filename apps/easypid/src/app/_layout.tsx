import 'fast-text-encoding'

import { isGetCredentialActivity } from '@animo-id/expo-digital-credentials-api'
import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { BackgroundLockProvider, NoInternetToastProvider, Provider } from '@package/app'
import { ParadymWalletSdk } from '@package/sdk'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { Platform } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import tamaguiConfig from '../../tamagui.config'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: '/(app)/index',
}

export default function RootLayoutWithoutDcApi() {
  // With Expo Router the main application is always rendered, which is different from plain react native
  // To prevent this, we render null at the root
  if (Platform.OS === 'android' && isGetCredentialActivity()) {
    console.log('not rendering main application due to DC API')
    return null
  }

  return <RootLayout />
}

function RootLayout() {
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
          <BackgroundLockProvider>
            <NoInternetToastProvider>
              <Slot />
            </NoInternetToastProvider>
          </BackgroundLockProvider>
        </ThemeProvider>
      </ParadymWalletSdk.UnlockProvider>
    </Provider>
  )
}
