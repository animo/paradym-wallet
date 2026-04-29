import type { SubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import type { PinDotsInputRef } from '@package/app'
import { useRef, useState } from 'react'
import { WalletPinPromptInput, WalletUnlockPromptInput } from './WalletPinPrompt'

export type OnWalletAuthSubmitProps = { pin?: string; onAuthorized?: () => void; onAuthorizationError?: () => void }

export interface WalletFlowAuthPromptProps {
  authMode: Exclude<SubmissionAuthorizationMode, 'none'>
  onSubmit: ({ pin, onAuthorized, onAuthorizationError }: OnWalletAuthSubmitProps) => Promise<void>
  isLoading: boolean
}

export function WalletFlowAuthPrompt({ authMode, onSubmit, isLoading }: WalletFlowAuthPromptProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)

  const onAuthorizationError = () => {
    setIsAuthorized(false)
    pinRef.current?.shake()
    pinRef.current?.clear()
  }

  const submit = (pin?: string) => {
    if (isSubmitting || isAuthorized) return

    let didAuthorize = false
    setIsSubmitting(true)
    void onSubmit({
      pin,
      onAuthorizationError,
      onAuthorized: () => {
        didAuthorize = true
        setIsAuthorized(true)
      },
    }).finally(() => {
      if (!didAuthorize) setIsSubmitting(false)
    })
  }

  const isPromptLoading = isLoading || isSubmitting || isAuthorized

  return authMode === 'pin-only' ? (
    <WalletPinPromptInput onPinComplete={submit} isLoading={isPromptLoading} inputRef={pinRef} />
  ) : (
    <WalletUnlockPromptInput
      onPinComplete={submit}
      onBiometricsTap={() => submit()}
      isLoading={isPromptLoading}
      inputRef={pinRef}
    />
  )
}
