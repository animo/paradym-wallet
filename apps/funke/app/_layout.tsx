import { NoInternetToastProvider, Provider, useTransparentNavigationBar } from '@package/app'
import { SecureUnlockProvider, useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'

import tamaguiConfig from '../tamagui.config'
import type { FunkeAppAgent } from '@package/agent'

void SplashScreen.preventAutoHideAsync()

export const useSecureUnlock = () => _useSecureUnlock<{ agent?: FunkeAppAgent }>()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: '(app)/index',
}

export default function RootLayout() {
  useTransparentNavigationBar()

  return (
    <Provider config={tamaguiConfig}>
      <SecureUnlockProvider>
        <ThemeProvider value={DefaultTheme}>
          <NoInternetToastProvider>
            <Slot />
          </NoInternetToastProvider>
        </ThemeProvider>
      </SecureUnlockProvider>
    </Provider>
  )
}
