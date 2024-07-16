import type { TamaguiProviderProps } from '@package/ui'

import { CustomToast, TamaguiProvider, ToastProvider } from '@package/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { PropsWithChildren } from 'react'
import { ToastViewport } from './ToastViewport'

const queryClient = new QueryClient()

export function Provider({ children, ...rest }: PropsWithChildren<TamaguiProviderProps>) {
  return (
    <TamaguiProvider disableInjectCSS defaultTheme="light" {...rest}>
      <ToastProvider
        swipeDirection="up"
        duration={6000}
        native={
          [
            /* uncomment the next line to do native toasts on mobile. NOTE: it'll require you making a dev build and won't work with Expo Go */
            // 'mobile'
          ]
        }
      >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        <CustomToast />
        <ToastViewport />
      </ToastProvider>
    </TamaguiProvider>
  )
}
