import { generateKeypair } from '@animo-id/expo-secure-environment'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

export function useCanUseSecureEnclave() {
  if (Platform.OS === 'ios') return true

  const [canUseSecureEnclave, setCanUseSecureEnclave] = useState<boolean>()

  useEffect(() => {
    generateKeypair('123', false)
      .then(() => setCanUseSecureEnclave(true))
      .catch(() => setCanUseSecureEnclave(false))
  }, [])

  return canUseSecureEnclave
}
