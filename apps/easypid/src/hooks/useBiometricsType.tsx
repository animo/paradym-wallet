import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as Keychain from 'react-native-keychain'

export function useBiometricsType() {
  // Set initial state based on platform (iOS has higher probability for face id)
  const [biometryType, setBiometryType] = useState<'face' | 'fingerprint'>(
    Platform.OS === 'ios' ? 'face' : 'fingerprint'
  )

  useEffect(() => {
    async function checkBiometryType() {
      const supportedBiometryType = await Keychain.getSupportedBiometryType()
      if (supportedBiometryType) {
        setBiometryType(supportedBiometryType?.toLowerCase().includes('face') ? 'face' : 'fingerprint')
      }
    }

    checkBiometryType()
  }, [])

  return biometryType
}
