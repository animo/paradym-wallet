import { type SupportedLocale, TranslationProvider } from '@package/translations'
import type { TamaguiProviderProps } from '@package/ui'
import { TamaguiProvider, ToastProvider } from '@package/ui'
import type { PropsWithChildren } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CustomToast } from '../components'
import { ToastViewport } from './ToastViewport'

export function Provider({
  children,
  customLocale,
  defaultTheme = 'light',
  ...rest
}: PropsWithChildren<
  Omit<TamaguiProviderProps, 'defaultTheme'> & {
    customLocale?: SupportedLocale
    defaultTheme?: TamaguiProviderProps['defaultTheme']
  }
>) {
  return (
    <TranslationProvider customLocale={customLocale}>
      <TamaguiProvider disableInjectCSS defaultTheme={defaultTheme} {...rest}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ToastProvider swipeDirection="up" duration={6000}>
            <SafeAreaProvider style={{ backgroundColor: 'white' }}>{children}</SafeAreaProvider>
            <CustomToast />
            <ToastViewport />
          </ToastProvider>
        </GestureHandlerRootView>
      </TamaguiProvider>
    </TranslationProvider>
  )
}
