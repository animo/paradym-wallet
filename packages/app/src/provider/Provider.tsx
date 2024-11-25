import type { TamaguiProviderProps } from '@package/ui'
import { PortalProvider } from '@tamagui/portal'

import { CustomToast, TamaguiProvider, ToastProvider } from '@package/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import type { PropsWithChildren } from 'react'
import { ToastViewport } from './ToastViewport'

const queryClient = new QueryClient()

export function Provider({ children, ...rest }: PropsWithChildren<TamaguiProviderProps>) {
  return (
    <TamaguiProvider disableInjectCSS defaultTheme="light" {...rest}>
      <PortalProvider shouldAddRootHost>
        <ToastProvider swipeDirection="up" duration={6000}>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>
          </QueryClientProvider>
          <CustomToast />
          <ToastViewport />
        </ToastProvider>
      </PortalProvider>
    </TamaguiProvider>
  )
}
