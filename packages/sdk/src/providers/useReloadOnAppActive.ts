import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'

export function useReloadOnAppActive(reload: () => void | Promise<void>) {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        void reload()
      }

      appState.current = nextAppState
    })

    return () => subscription.remove()
  }, [reload])
}
