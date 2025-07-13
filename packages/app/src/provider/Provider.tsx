import type { TamaguiProviderProps } from '@package/ui'

import { TamaguiProvider, ToastProvider } from '@package/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import type { PropsWithChildren } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CustomToast } from '../components'
import { ToastViewport } from './ToastViewport'
import { TranslationProvider } from '@package/translations'

const queryClient = new QueryClient()

export function Provider({ children, ...rest }: PropsWithChildren<TamaguiProviderProps>) {
  return (
    <TranslationProvider>
      <TamaguiProvider disableInjectCSS defaultTheme="light" {...rest}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <ToastProvider swipeDirection="up" duration={6000}>
              <QueryClientProvider client={queryClient}>
                <SafeAreaProvider style={{ backgroundColor: 'white' }}>{children}</SafeAreaProvider>
              </QueryClientProvider>
              <CustomToast />
              <ToastViewport />
            </ToastProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </TamaguiProvider>
    </TranslationProvider>
  )
}
