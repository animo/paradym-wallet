import type { ReactNode } from 'react'

import { useCredentialDataHandler } from 'app/hooks/useCredentialDataHandler'
import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'

interface DeeplinkHandlerProps {
  children: ReactNode
}

export const DeeplinkHandler = ({ children }: DeeplinkHandlerProps) => {
  const url = Linking.useURL()
  const [lastDeeplink, setLastDeeplink] = useState<string | null>(null)
  const { handleCredentialData } = useCredentialDataHandler()

  useEffect(() => {
    if (!url || url === lastDeeplink) return

    setLastDeeplink(url)
    void handleCredentialData(url)
  }, [url])

  return <>{children}</>
}
