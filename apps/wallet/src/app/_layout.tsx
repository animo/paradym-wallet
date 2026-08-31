import { paradymWalletSdkOptions } from '@app/config/paradym'
import { DcApiCredentialRegistration } from '@app/features/dc-api/DcApiCredentialRegistration'
import { BackgroundLockProvider, NoInternetToastProvider, Provider } from '@package/app'
import { ParadymWalletSdk } from '@paradym/wallet-sdk'
import { Slot } from 'expo-router'
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation'
import * as SplashScreen from 'expo-splash-screen'
import { SystemBars } from 'react-native-edge-to-edge'
import tamaguiConfig from '../../tamagui.config'
import { useStoredLocale } from '../hooks/useStoredLocale'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: '/(app)/index',
}

export default function RootLayout() {
  const [storedLocale] = useStoredLocale()

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
            <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
              <DcApiCredentialRegistration />
              <Slot />
            </ParadymWalletSdk.UnlockProvider>
          </NoInternetToastProvider>
        </BackgroundLockProvider>
      </ThemeProvider>
    </Provider>
  )
}
