import { type SupportedLocale, TranslationProvider } from '@package/translations'
import type { TamaguiProviderProps } from '@package/ui'
import { TamaguiProvider, Toast } from '@package/ui'
import type { PropsWithChildren } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
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
          <Toast position="top-center" swipeDirection="up" duration={6000} visibleToasts={1}>
            <SafeAreaProvider style={{ backgroundColor: 'white' }}>{children}</SafeAreaProvider>
            <ToastViewport />
          </Toast>
        </GestureHandlerRootView>
      </TamaguiProvider>
    </TranslationProvider>
  )
}
