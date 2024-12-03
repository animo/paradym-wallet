import { HeroIcons } from '@package/ui/src/content/Icon'

import { Switch } from '@package/ui/src/base/Switch'

import { useLLM } from '@easypid/llm/useLLM'
import { ConfirmationSheet } from '@package/app/src/components/ConfirmationSheet'
import { useToastController } from 'packages/ui/src'
import React, { useState } from 'react'

export function LocalAiContainer() {
  const toast = useToastController()

  const [isAiModelConfirmationOpen, setIsAiModelConfirmationOpen] = useState(false)
  const { loadModel, isModelReady, downloadProgress, removeModel, isModelActivated, isModelDownloading } = useLLM()

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
          isModelReady
            ? 'Model active and ready to use'
            : downloadProgress
              ? `Downloading model ${(downloadProgress * 100).toFixed(2)}%`
              : ''
        }
        onChange={handleAiModelChange}
      />
      <ConfirmationSheet
        type="floating"
        variant="regular"
        isOpen={isAiModelConfirmationOpen}
        setIsOpen={setIsAiModelConfirmationOpen}
        title="Use local AI model"
        confirmText="Enable"
        description="This will use a local AI model to analyze verifications for overasking. This will take up to around 2GB of space on your device."
        onConfirm={() => {
          setIsAiModelConfirmationOpen(false)
          loadModel()
        }}
      />
    </>
  )
}
