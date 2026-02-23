import 'fast-text-encoding'

import { isCreateCredentialActivity, isGetCredentialActivity } from '@animo-id/expo-digital-credentials-api'
import { registerCreationOptionsForDcApi } from '@package/agent'
import { BackgroundLockProvider, NoInternetToastProvider, Provider } from '@package/app'
import { SecureUnlockProvider } from '@package/secure-store/secureUnlock'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import tamaguiConfig from '../../tamagui.config'
import { useStoredLocale } from '../hooks/useStoredLocale'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: '/(app)/index',
}

export default function RootLayoutWithoutDcApi() {
  // With Expo Router the main application is always rendered, which is different from plain react native
  // To prevent this, we render null at the root
  if (Platform.OS === 'android' && (isGetCredentialActivity() || isCreateCredentialActivity())) {
    console.log('not rendering main application due to DC API')
    return null
  }

  return <RootLayout />
}

function RootLayout() {
  const [storedLocale] = useStoredLocale()

  useEffect(() => {
    void registerCreationOptionsForDcApi()
  }, [])

  return (
    <Provider config={tamaguiConfig} customLocale={storedLocale}>
      <SystemBars style="dark" />
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
              <Slot />
            </NoInternetToastProvider>
          </BackgroundLockProvider>
        </ThemeProvider>
      </SecureUnlockProvider>
    </Provider>
  )
}
