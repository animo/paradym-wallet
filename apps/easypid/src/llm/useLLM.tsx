import * as Device from 'expo-device'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { LLAMA3_2_1B_QLORA_URL, LLAMA3_2_1B_TOKENIZER } from 'react-native-executorch'
import RnExecutorch, { subscribeToDownloadProgress, subscribeToTokenGenerated } from './RnExecutorchModule'
import { EOT_TOKEN } from './constants'
import { OVERASKING_PROMPT } from './prompt'
import {
  removeIsModelActivated,
  removeIsModelDownloading,
  removeIsModelReady,
  useIsModelActivated,
  useIsModelDownloading,
  useIsModelReady,
} from './state'
import type { Model } from './types'

const interrupt = () => {
  RnExecutorch.interrupt()
}

// FIXME: The model expects a system prompt on initializing, but this blocks it from being used for different tasks.
export const useLLM = (): Model => {
  const [error, setError] = useState<string | null>(null)
  const [isModelActivated, setIsModelActivated] = useIsModelActivated()
  const [isModelDownloading, setIsModelDownloading] = useIsModelDownloading()
  const [isModelReady, setIsModelReady] = useIsModelReady()
  const [isModelGenerating, setIsModelGenerating] = useState(false)
  const [response, setResponse] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const initialized = useRef(false)

  useEffect(() => {
    if (!response) return
    console.debug('Local LLM response', response)
  }, [response])

  useEffect(() => {
    if (!error) return
    console.debug('Local LLM error', error)
  }, [error])

  useEffect(() => {
    const unsubscribeDownloadProgress = subscribeToDownloadProgress((data) => {
      if (data) {
        setDownloadProgress(data)
      }
    })

    return () => {
      if (unsubscribeDownloadProgress) unsubscribeDownloadProgress()
    }
  }, [])

  const loadModel = useCallback(async () => {
    if (initialized.current) {
      return
    }

    setIsModelActivated(true)
    initialized.current = true
    try {
      try {
        setIsModelDownloading(true)
        await RnExecutorch.loadLLM(LLAMA3_2_1B_QLORA_URL, LLAMA3_2_1B_TOKENIZER, OVERASKING_PROMPT, 2)
        await RnExecutorch
      } catch (error) {
        console.log('ERROR LOADING MODEL', error)
      }
      setIsModelDownloading(false)
      setIsModelActivated(true)
      setIsModelReady(true)
    } catch (err) {
      const message = (err as Error).message
      setIsModelReady(false)
      setIsModelDownloading(false)
      setError(message)
      initialized.current = false
    }
  }, [setIsModelReady, setIsModelActivated, setIsModelDownloading])

  const generate = useCallback(
    async (input: string): Promise<void> => {
      if (!isModelReady || !isModelActivated) {
        throw new Error('Model not active or still loading')
      }
      if (error) {
        throw new Error(error)
      }

      try {
        setResponse('') // This might be causing issues - let's move it
        setIsModelGenerating(true)
        await RnExecutorch.runInference(input)
      } catch (err) {
        setIsModelGenerating(false)
        throw new Error((err as Error).message)
      }
    },
    [isModelReady, error, isModelActivated]
  )

  // Move the token subscription to useEffect to ensure it persists
  useEffect(() => {
    const unsubscribeTokenGenerated = subscribeToTokenGenerated((data) => {
      if (!data) return

      if (data !== EOT_TOKEN) {
        setResponse((prevResponse) => prevResponse + data)
      } else {
        setIsModelGenerating(false)
      }
    })

    return () => {
      if (unsubscribeTokenGenerated) unsubscribeTokenGenerated()
    }
  }, [])

  // Doesn't actually remove the model, just the state
  const removeModel = useCallback(() => {
    removeIsModelReady()
    removeIsModelActivated()
    removeIsModelDownloading()
    initialized.current = false
  }, [])

  return {
    generate,
    error,
    isModelActivated: isModelActivated ?? false,
    isModelReady: isModelReady ?? false,
    isModelDownloading: isModelDownloading ?? false,
    isModelGenerating,
    response,
    downloadProgress,
    interrupt,
    loadModel,
    removeModel,
  }
}

// Check for incomplete model download from previous session
// Used when the app is opened
export function useCheckIncompleteDownload() {
  const [isModelActivated] = useIsModelActivated()
  const [isModelDownloading] = useIsModelDownloading()
  const [isModelReady] = useIsModelReady()

  // biome-ignore lint/correctness/useExhaustiveDependencies: should only run once
  useEffect(() => {
    if (isModelActivated && isModelDownloading && !isModelReady) {
      console.log('Cleaning up incomplete model download from previous session')
      removeIsModelReady()
      removeIsModelActivated()
      removeIsModelDownloading()
    }
  }, [])
}

export function useIsDeviceCapable(): boolean {
  // For iOS, check if device is at least iPhone 12 or newer
  if (Platform.OS === 'ios') {
    const modelId = Device.modelId ?? ''
    // iPhone 12 series and newer start with iPhone13 (iPhone12 = iPhone13,2)
    return /iPhone1[3-9]/.test(modelId) || /iPhone[2-9][0-9]/.test(modelId)
  }

  // For Android, check for minimum 4GB RAM
  if (Platform.OS === 'android') {
    const totalMemory = Device.totalMemory ?? 0
    // totalMemory is in bytes, convert 4GB to bytes (4 * 1024 * 1024 * 1024)
    const MIN_REQUIRED_RAM = 4 * 1024 * 1024 * 1024
    return totalMemory >= MIN_REQUIRED_RAM
  }

  return false
}
