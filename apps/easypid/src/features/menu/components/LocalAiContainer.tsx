import { HeroIcons } from '@package/ui/src/content/Icon'

import { Switch } from '@package/ui/src/base/Switch'

import { useIsDeviceCapable, useLLM } from '@easypid/llm'
import { ConfirmationSheet } from '@package/app/src/components/ConfirmationSheet'
import { useHasInternetConnection, useIsConnectedToWifi } from 'packages/app/src/hooks'
import { useToastController } from 'packages/ui/src'
import { useState } from 'react'

export function LocalAiContainer() {
  const toast = useToastController()
  const isConnectedToWifi = useIsConnectedToWifi()
  const hasInternetConnection = useHasInternetConnection()
  const isDeviceCapable = useIsDeviceCapable()

  const [isAiModelConfirmationOpen, setIsAiModelConfirmationOpen] = useState(false)
  const { loadModel, isModelReady, downloadProgress, removeModel, isModelActivated, isModelDownloading } = useLLM()

  const onActivateModel = () => {
    if (!isDeviceCapable) {
      toast.show('Device not supported', {
        message: 'This device is not powerful enough to run local AI models',
        customData: {
          preset: 'warning',
        },
      })
      setIsAiModelConfirmationOpen(false)
      return
    }
    if (!isConnectedToWifi && !hasInternetConnection) {
      toast.show('WiFi connection required', {
        message: 'Please connect to WiFi to activate and download the model',
        customData: {
          preset: 'warning',
        },
      })
      setIsAiModelConfirmationOpen(false)
      return
    }

    setIsAiModelConfirmationOpen(false)
    loadModel()
  }

  const handleAiModelChange = (value: boolean) => {
    if (isModelDownloading) {
      toast.show('Model download in progress', {
        message: 'Force close the app to cancel the download',
        customData: {
          preset: 'warning',
        },
      })
      return
    }

    if (value) {
      setIsAiModelConfirmationOpen(true)
    } else {
      removeModel()
    }
  }

  return (
    <>
      <Switch
        id="local-ai-model"
        label="Use local AI model"
        icon={<HeroIcons.CpuChipFilled />}
        value={isModelActivated}
        description={
          isModelActivated
            ? isModelReady
              ? 'Model active and ready to use'
              : downloadProgress
                ? `Downloading model ${(downloadProgress * 100).toFixed(2)}%`
                : 'Getting ready...'
            : ''
        }
        onChange={handleAiModelChange}
        beta
      />
      <ConfirmationSheet
        type="floating"
        variant="regular"
        isOpen={isAiModelConfirmationOpen}
        setIsOpen={setIsAiModelConfirmationOpen}
        title="Enable local AI model"
        confirmText="Enable"
        cancelText="Cancel"
        description={[
          'This will download a local AI model to your device which will take up to around 1.3GB of space.',
          'This is an experimental feature. Only supported on high-end devices.',
        ]}
        onConfirm={onActivateModel}
      />
    </>
  )
}
