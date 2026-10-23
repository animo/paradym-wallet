import { getLoggingOptions, paradymWalletSdkOptions } from '@app/config/paradym'
import { BackgroundLockProvider, NoInternetToastProvider, Provider } from '@package/app'
import { ParadymWalletSdk } from '@paradym/wallet-sdk'
import { Slot } from 'expo-router'
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation'
import * as SplashScreen from 'expo-splash-screen'
import { useMemo } from 'react'
import { SystemBars } from 'react-native-edge-to-edge'
import tamaguiConfig from '../../tamagui.config'
import { useDevelopmentMode } from '../hooks/useDevelopmentMode'
import { useStoredLocale } from '../hooks/useStoredLocale'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  anchor: '(app)',
}

export default function RootLayout() {
  const [storedLocale] = useStoredLocale()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  // Unlock sets up its agent from the configuration it was last rendered with, so the next unlock
  // picks up a change to development mode.
  const configuration = useMemo(
    () => ({ ...paradymWalletSdkOptions, logging: getLoggingOptions(isDevelopmentModeEnabled) }),
    [isDevelopmentModeEnabled]
  )

  return (
    <Provider config={tamaguiConfig} customLocale={storedLocale}>
      <SystemBars style="dark" />
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
            <ParadymWalletSdk.UnlockProvider configuration={configuration}>
              <Slot />
            </ParadymWalletSdk.UnlockProvider>
          </NoInternetToastProvider>
        </BackgroundLockProvider>
      </ThemeProvider>
    </Provider>
  )
}
