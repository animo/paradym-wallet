import { HeroIcons } from '@package/ui/content/Icon'

import { Switch } from '@package/ui/base/Switch'

import { useIsDeviceCapable, useLLM } from '@easypid/llm'
import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { ConfirmationSheet } from '@package/app/components/ConfirmationSheet'
import { useHasInternetConnection, useIsConnectedToWifi } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { useState } from 'react'

const localAiMessages = {
  modelNotSupportedTitle: defineMessage({
    id: 'localAi.toast.unsupported.title',
    message: 'Device not supported',
    comment: 'Title of toast when local AI model cannot be used due to device limitations',
  }),
  modelNotSupportedMessage: defineMessage({
    id: 'localAi.toast.unsupported.message',
    message: 'This device is not powerful enough to run local AI models',
    comment: 'Message shown when device cannot handle the AI model',
  }),
  wifiRequiredTitle: defineMessage({
    id: 'localAi.toast.noWifi.title',
    message: 'WiFi connection required',
    comment: 'Title of toast when no internet or WiFi is available',
  }),
  wifiRequiredMessage: defineMessage({
    id: 'localAi.toast.noWifi.message',
    message: 'Please connect to WiFi to activate and download the model',
    comment: 'Message shown when trying to download AI model without WiFi',
  }),
  downloadInProgressTitle: defineMessage({
    id: 'localAi.toast.downloading.title',
    message: 'Model download in progress',
    comment: 'Title of toast when model is already downloading',
  }),
  downloadInProgressMessage: defineMessage({
    id: 'localAi.toast.downloading.message',
    message: 'Force close the app to cancel the download',
    comment: 'Message shown when a download is in progress and cannot be stopped from the UI',
  }),
  switchLabel: defineMessage({
    id: 'localAi.switch.label',
    message: 'Use local AI model',
    comment: 'Label for switch to enable or disable local AI model',
  }),
  modelActive: defineMessage({
    id: 'localAi.status.ready',
    message: 'Model active and ready to use',
    comment: 'Status text when the AI model is ready',
  }),
  modelPreparing: defineMessage({
    id: 'localAi.status.preparing',
    message: 'Getting ready...',
    comment: 'Status text when the model is not ready yet and not downloading',
  }),
  confirmTitle: defineMessage({
    id: 'localAi.confirm.title',
    message: 'Enable local AI model',
    comment: 'Title of the confirmation dialog before activating the local model',
  }),
  confirmButton: defineMessage({
    id: 'common.enable',
    message: 'Enable',
    comment: 'Generic label for enabling a feature',
  }),
  confirmDescription1: defineMessage({
    id: 'localAi.confirm.description1',
    message: 'This will download a local AI model to your device which will take up to around 1.3GB of space.',
    comment: 'First paragraph of confirmation sheet explaining model size',
  }),
  confirmDescription2: defineMessage({
    id: 'localAi.confirm.description2',
    message: 'This is an experimental feature. Only supported on high-end devices.',
    comment: 'Second paragraph of confirmation sheet warning about device compatibility',
  }),
}

export function LocalAiContainer() {
  const toast = useToastController()
  const isConnectedToWifi = useIsConnectedToWifi()
  const hasInternetConnection = useHasInternetConnection()
  const isDeviceCapable = useIsDeviceCapable()
  const { t } = useLingui()

  const [isAiModelConfirmationOpen, setIsAiModelConfirmationOpen] = useState(false)
  const { isModelReady, downloadProgress, isModelActivated, isModelDownloading, activateModel, deactivateModel } =
    useLLM()

  const onActivateModel = () => {
    if (!isDeviceCapable) {
      toast.show(t(localAiMessages.modelNotSupportedTitle), {
        message: t(localAiMessages.modelNotSupportedMessage),
        customData: {
          preset: 'warning',
        },
      })
      setIsAiModelConfirmationOpen(false)
      return
    }
    if (!isConnectedToWifi && !hasInternetConnection) {
      toast.show(t(localAiMessages.wifiRequiredTitle), {
        message: t(localAiMessages.wifiRequiredMessage),
        customData: {
          preset: 'warning',
        },
      })

      setIsAiModelConfirmationOpen(false)
      return
    }

    setIsAiModelConfirmationOpen(false)
    activateModel()
  }

  const handleAiModelChange = (value: boolean) => {
    if (isModelDownloading) {
      toast.show(t(localAiMessages.downloadInProgressTitle), {
        message: t(localAiMessages.downloadInProgressMessage),
        customData: {
          preset: 'warning',
        },
      })
      return
    }

    if (value) {
      setIsAiModelConfirmationOpen(true)
    } else {
      deactivateModel()
    }
  }

  return (
    <>
      <Switch
        id="local-ai-model"
        label={t(localAiMessages.switchLabel)}
        icon={<HeroIcons.CpuChipFilled />}
        value={isModelActivated}
        description={
          isModelActivated
            ? isModelReady
              ? t(localAiMessages.modelActive)
              : downloadProgress
                ? t({
                    id: 'localAi.status.downloading',
                    message: `Downloading model ${(downloadProgress * 100).toFixed(2)}%`,
                    comment: 'Status text while model is downloading, showing percentage',
                  })
                : t(localAiMessages.modelPreparing)
            : ''
        }
        onChange={handleAiModelChange}
        beta
      />

      <ConfirmationSheet
        variant="regular"
        isOpen={isAiModelConfirmationOpen}
        setIsOpen={setIsAiModelConfirmationOpen}
        title={t(localAiMessages.confirmTitle)}
        confirmText={t(localAiMessages.confirmButton)}
        cancelText={t(commonMessages.cancel)}
        description={[t(localAiMessages.confirmDescription1), t(localAiMessages.confirmDescription2)]}
        onConfirm={onActivateModel}
      />
    </>
  )
}
