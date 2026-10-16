import { useParadym } from '@paradym/wallet-sdk'
import * as Application from 'expo-application'
import * as Device from 'expo-device'
import { useEffect } from 'react'
import { Platform } from 'react-native'

/**
 * Logs the build, OS and device the wallet runs on, so exported debug logs say where they came from.
 *
 * Once per unlock rather than once per app start: every unlock sets up a new agent and logger, and
 * the export holds only the last messages, where a single entry from app start is soon overwritten.
 *
 * App only, not the credential request UI: its logs are exported together with these, and the iOS
 * extension it runs in does not link `expo-application` or `expo-device`.
 */
export function useLogDeviceInformation() {
  const paradym = useParadym()
  const unlockedParadym = paradym.state === 'unlocked' ? paradym.paradym : undefined

  useEffect(() => {
    unlockedParadym?.logger.info('Device information', {
      platform: Platform.OS,
      osName: Device.osName,
      osVersion: Device.osVersion,
      // The API level, which the Android version name does not say
      androidApiLevel: Platform.OS === 'android' ? Platform.Version : undefined,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      modelId: Device.modelId,
      isDevice: Device.isDevice,
      applicationId: Application.applicationId,
      applicationVersion: Application.nativeApplicationVersion,
      buildNumber: Application.nativeBuildVersion,
    })
  }, [unlockedParadym])
}
