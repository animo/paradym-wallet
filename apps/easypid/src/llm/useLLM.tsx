import * as Device from 'expo-device'
import { useCallback } from 'react'
import { Platform } from 'react-native'
import { LLAMA3_2_1B, useLLM as useExecutorchLLM } from 'react-native-executorch'
import { useIsModelActivated } from './state'

// FIXME: The model expects a system prompt on initializing, but this blocks it from being used for different tasks.
export const useLLM = () => {
  const [isModelActivated, setIsModelActivated] = useIsModelActivated()

  const {
    downloadProgress,
    isGenerating,
    isReady,
    error,
    interrupt,
    generate: rawGenerate,
    response,
  } = useExecutorchLLM({
    model: LLAMA3_2_1B,
    preventLoad: isModelActivated,
  })

  const generate = useCallback(
    async (input: string): Promise<void> => {
      if (!isModelActivated || !isReady) {
        throw new Error('Model not active or still loading')
      }
      if (error) {
        throw new Error(error)
      }

      try {
        await rawGenerate([{ content: input, role: 'system' }])
      } catch (err) {
        throw new Error((err as Error).message)
      }
    },
    [isReady, error, isModelActivated, rawGenerate]
  )

  const activateModel = useCallback(() => setIsModelActivated(true), [setIsModelActivated])
  const deactivateModel = useCallback(() => setIsModelActivated(false), [setIsModelActivated])

  return {
    generate,
    error,
    isModelActivated,
    isModelReady: isReady,
    isModelDownloading: isModelActivated && !isReady,
    isModelGenerating: isGenerating,
    response,
    downloadProgress,
    interrupt,
    activateModel,
    deactivateModel,
  }
}

export function useIsDeviceCapable(): boolean {
  // For iOS, check if device is at least iPhone 12 or newer and iOS 17.0 or newer
  if (Platform.OS === 'ios') {
    const modelId = Device.modelId ?? ''
    const systemVersion = Number.parseFloat(Device.osVersion ?? '0')
    // iPhone 12 series and newer start with iPhone13 (iPhone12 = iPhone13,2)
    const isSupportedModel = /iPhone1[3-9]/.test(modelId) || /iPhone[2-9][0-9]/.test(modelId)
    return isSupportedModel && systemVersion >= 17.0
  }

  // For Android, check for minimum 4GB RAM and Android 13 or newer
  if (Platform.OS === 'android') {
    const totalMemory = Device.totalMemory ?? 0
    const MIN_REQUIRED_RAM = 4 * 1024 * 1024 * 1024
    const systemVersion = Number.parseInt(Device.osVersion ?? '0', 10)
    return totalMemory >= MIN_REQUIRED_RAM && systemVersion >= 13
  }

  return false
}
