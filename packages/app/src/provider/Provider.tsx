import type { TamaguiProviderProps } from '@package/ui'

import { CustomToast, TamaguiProvider, ToastProvider } from '@package/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useColorScheme } from 'react-native'

import { ToastViewport } from './ToastViewport'

const queryClient = new QueryClient()

export function Provider({ children, ...rest }: TamaguiProviderProps) {
  const scheme = useColorScheme()
  return (
    <TamaguiProvider disableInjectCSS defaultTheme={scheme === 'dark' ? 'dark' : 'light'} {...rest}>
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
