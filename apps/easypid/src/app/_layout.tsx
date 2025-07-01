import 'fast-text-encoding'

import { isGetCredentialActivity } from '@animo-id/expo-digital-credentials-api'
import { BackgroundLockProvider, NoInternetToastProvider, Provider, useTransparentNavigationBar } from '@package/app'
import { SecureUnlockProvider } from '@package/secure-store/secureUnlock'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { Platform } from 'react-native'
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
  useTransparentNavigationBar()

  return (
    <Provider config={tamaguiConfig}>
      <SecureUnlockProvider>
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
              <StatusBar />
              <Slot />
            </NoInternetToastProvider>
          </BackgroundLockProvider>
        </ThemeProvider>
      </SecureUnlockProvider>
    </Provider>
  )
}
