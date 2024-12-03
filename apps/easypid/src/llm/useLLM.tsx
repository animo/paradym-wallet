import { mmkv } from '@easypid/storage/mmkv'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Image } from 'react-native'
import { LLAMA3_2_1B_QLORA_URL, LLAMA3_2_1B_TOKENIZER } from 'react-native-executorch'
import { useMMKVBoolean } from 'react-native-mmkv'
import RnExecutorch, { subscribeToDownloadProgress, subscribeToTokenGenerated } from './RnExecutorchModule'
import { DEFAULT_CONTEXT_WINDOW_LENGTH, DEFAULT_SYSTEM_PROMPT, EOT_TOKEN } from './constants'
import type { Model, ResourceSource } from './types'

const interrupt = () => {
  RnExecutorch.interrupt()
}

export function useIsModelReady() {
  return useMMKVBoolean('isModelReady', mmkv)
}

export function removeIsModelReady() {
  mmkv.delete('isModelReady')
}

export function useIsModelActivated() {
  return useMMKVBoolean('isModelActivated', mmkv)
}

export function removeIsModelActivated() {
  mmkv.delete('isModelActivated')
}

export function useIsModelDownloading() {
  return useMMKVBoolean('isModelDownloading', mmkv)
}

export function removeIsModelDownloading() {
  mmkv.delete('isModelDownloading')
}

export const useLLM = ({
  modelSource = LLAMA3_2_1B_QLORA_URL,
  tokenizerSource = LLAMA3_2_1B_TOKENIZER,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  contextWindowLength = DEFAULT_CONTEXT_WINDOW_LENGTH,
}: {
  modelSource?: ResourceSource
  tokenizerSource?: ResourceSource
  systemPrompt?: string
  contextWindowLength?: number
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
        await RnExecutorch.loadLLM(modelSource, tokenizerSource, systemPrompt, contextWindowLength)
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
  }, [
    contextWindowLength,
    modelSource,
    systemPrompt,
    tokenizerSource,
    setIsModelReady,
    setIsModelActivated,
    setIsModelDownloading,
  ])

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
