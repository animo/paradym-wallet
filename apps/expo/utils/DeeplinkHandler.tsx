import type { ReactNode } from 'react'

import { InvitationQrTypes } from '@internal/agent'
import { useToastController } from '@internal/ui'
import { CommonActions } from '@react-navigation/native'
import { useCredentialDataHandler } from 'app/hooks/useCredentialDataHandler'
import * as Linking from 'expo-linking'
import { useNavigation } from 'expo-router'
import { useEffect, useState } from 'react'

interface DeeplinkHandlerProps {
  children: ReactNode
}

const deeplinkSchemes = Object.values(InvitationQrTypes)

export const DeeplinkHandler = ({ children }: DeeplinkHandlerProps) => {
  const { handleCredentialData } = useCredentialDataHandler()
  const toast = useToastController()
  const navigation = useNavigation()

  // TODO: I'm not sure if we need this? Or whether an useEffect without any deps is enough?
  const [hasHandledInitialUrl, setHasHandledInitialUrl] = useState(false)

  function handleUrl(url: string) {
    const isRecognizedDeeplink = deeplinkSchemes.some((scheme) => url.startsWith(scheme))

    // Whenever a deeplink comes in, we reset the state. This is due to expo
    // routing us always and we can't intercept that. It seems they are working on
    // more control, but for now this is the cleanest approach
    navigation.dispatch(
      CommonActions.reset({
        routes: [{ key: 'index', name: 'index' }],
      })
    )

    // Ignore deeplinks that don't start with the schemes for credentials
    if (isRecognizedDeeplink) {
      void handleCredentialData(url).then((result) => {
        if (!result.success) {
          toast.show(result.error)
        }
      })
    }
  }

  // NOTE: we use getInitialURL and the event listener over useURL as we don't know
  // using that method whether the same url is opened multiple times. As we need to make
  // sure to handle ALL incoming deeplinks (to prevent default expo-router behaviour) we
  // handle them ourselves. On startup getInitialUrl will be called once.
  useEffect(() => {
    if (hasHandledInitialUrl) return
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url)
      setHasHandledInitialUrl(true)
    })
  }, [hasHandledInitialUrl])

  useEffect(() => {
    const eventListener = Linking.addEventListener('url', (event) => handleUrl(event.url))
    return () => eventListener.remove()
  }, [])

  return <>{children}</>
}
