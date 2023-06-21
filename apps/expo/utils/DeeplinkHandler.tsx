import type { ReactNode } from 'react'

import { QrTypes } from '@internal/agent'
import { useCredentialDataHandler } from 'app/hooks/useCredentialDataHandler'
import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'

interface DeeplinkHandlerProps {
  children: ReactNode
}

const deeplinkSchemes = Object.values(QrTypes)

export const DeeplinkHandler = ({ children }: DeeplinkHandlerProps) => {
  const url = Linking.useURL()
  const [lastDeeplink, setLastDeeplink] = useState<string | null>(null)
  const { handleCredentialData } = useCredentialDataHandler()

  useEffect(() => {
    if (!url || url === lastDeeplink) return

    // Ignore deeplinks that don't start with the schemes for credentials
    if (!deeplinkSchemes.some((scheme) => url.startsWith(scheme))) return

    setLastDeeplink(url)
    void handleCredentialData(url)
  }, [url])

  return <>{children}</>
}
