import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { LLAMA3_2_1B_QLORA_URL, LLAMA3_2_1B_TOKENIZER } from 'react-native-executorch'
import RnExecutorch, { subscribeToDownloadProgress, subscribeToTokenGenerated } from './RnExecutorchModule'
import { DEFAULT_CONTEXT_WINDOW_LENGTH, EOT_TOKEN } from './constants'
import {
  removeIsModelActivated,
  removeIsModelDownloading,
  removeIsModelReady,
  useIsModelActivated,
  useIsModelDownloading,
  useIsModelReady,
} from './state'
import type { Model, ResourceSource } from './types'

const interrupt = () => {
  RnExecutorch.interrupt()
}

export const useLLM = ({
  modelSource = LLAMA3_2_1B_QLORA_URL,
  tokenizerSource = LLAMA3_2_1B_TOKENIZER,
}: {
  modelSource?: ResourceSource
  tokenizerSource?: ResourceSource
} = {}): Model => {
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
        await RnExecutorch.loadLLM(modelSource, tokenizerSource, '', DEFAULT_CONTEXT_WINDOW_LENGTH)
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
  }, [modelSource, tokenizerSource, setIsModelReady, setIsModelActivated, setIsModelDownloading])

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

// TODO: Add expo-device to check if the device is capable
export function useIsDeviceCapable(): boolean {
  // For iOS, check if device is at least iPhone X or newer
  if (Platform.OS === 'ios') {
    return true
  }

  // For Android, check RAM
  if (Platform.OS === 'android') {
    return true
  }

  return false
}
