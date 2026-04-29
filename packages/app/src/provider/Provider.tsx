import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
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
  rootBackgroundColor = 'white',
  ...rest
}: PropsWithChildren<TamaguiProviderProps & { customLocale?: SupportedLocale; rootBackgroundColor?: string }>) {
  return (
    <TranslationProvider customLocale={customLocale}>
      <TamaguiProvider disableInjectCSS defaultTheme="light" {...rest}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <ToastProvider swipeDirection="up" duration={6000}>
              <SafeAreaProvider style={{ backgroundColor: rootBackgroundColor }}>
                {children}
                <CustomToast />
                <ToastViewport />
              </SafeAreaProvider>
            </ToastProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </TamaguiProvider>
    </TranslationProvider>
  )
}
