import 'fast-text-encoding'

import { useCheckIncompleteDownload } from '@easypid/llm'
import { BackgroundLockProvider, NoInternetToastProvider, Provider, useTransparentNavigationBar } from '@package/app'
import { SecureUnlockProvider } from '@package/secure-store/secureUnlock'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import tamaguiConfig from '../../tamagui.config'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: '/(app)/index',
}

export default function RootLayout() {
  useTransparentNavigationBar()
  useCheckIncompleteDownload()

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
              <Slot />
            </NoInternetToastProvider>
          </BackgroundLockProvider>
        </ThemeProvider>
      </SecureUnlockProvider>
    </Provider>
  )
}
