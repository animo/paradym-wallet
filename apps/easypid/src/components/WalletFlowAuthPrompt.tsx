import type { SubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import { useLingui } from '@lingui/react/macro'
import type { PinDotsInputRef } from '@package/app'
import { commonMessages } from '@package/translations'
import { useRef, useState } from 'react'
import { YStack } from 'tamagui'
import { WalletPinPromptHeader, WalletPinPromptInput, WalletUnlockPromptInput } from './WalletPinPrompt'

export type OnWalletAuthSubmitProps = { pin?: string; onAuthorized?: () => void; onAuthorizationError?: () => void }

export interface WalletFlowAuthPromptProps {
  authMode: Exclude<SubmissionAuthorizationMode, 'none'>
  onSubmit: ({ pin, onAuthorized, onAuthorizationError }: OnWalletAuthSubmitProps) => Promise<void>
  isLoading: boolean
  annotation?: string
}

export function WalletFlowAuthPrompt({ authMode, onSubmit, isLoading, annotation }: WalletFlowAuthPromptProps) {
  const { t } = useLingui()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)

  const onAuthorizationError = () => {
    pinRef.current?.shake()
    pinRef.current?.clear()
  }

  const submit = (pin?: string) => {
    setIsSubmitting(true)
    void onSubmit({ pin, onAuthorizationError }).finally(() => setIsSubmitting(false))
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4">
        <WalletPinPromptHeader title={t(commonMessages.enterPinToShareData)} annotation={annotation} />
      </YStack>
      <YStack fg={1} mt="$10">
        {authMode === 'pin-only' ? (
          <WalletPinPromptInput onPinComplete={submit} isLoading={isLoading || isSubmitting} inputRef={pinRef} />
        ) : (
          <WalletUnlockPromptInput
            onPinComplete={submit}
            onBiometricsTap={() => submit()}
            isLoading={isLoading || isSubmitting}
            inputRef={pinRef}
          />
        )}
      </YStack>
    </YStack>
  )
}
