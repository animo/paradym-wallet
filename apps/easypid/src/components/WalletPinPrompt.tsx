import { PinDotsInput, type PinDotsInputRef } from '@package/app'
import { Heading, Paragraph, Stack } from '@package/ui'
import { useBiometricUnlockState } from '@paradym/wallet-sdk'
import type { ReactNode, Ref } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getBiometricsType } from '../utils/biometrics'

interface WalletPinPromptHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  annotation?: ReactNode
  headerIcon?: ReactNode
  headerAction?: ReactNode
  titleHeading?: 'h1' | 'h2'
  titleFontWeight?: string
  centerHeader?: boolean
}

interface WalletPinPromptInputProps {
  isLoading: boolean
  onPinComplete: (pin: string) => void
  inputRef?: Ref<PinDotsInputRef>
  onBiometricsTap?: () => void
  biometricsType?: 'face' | 'fingerprint'
}

interface WalletUnlockPromptInputProps extends WalletPinPromptInputProps {
  onBiometricsTap: () => void | Promise<void>
  showBiometricUnlockAction?: boolean
  autoPromptBiometrics?: boolean
}

export function WalletPinPromptHeader({
  title,
  subtitle,
  annotation,
  headerIcon,
  headerAction,
  titleHeading,
  titleFontWeight,
  centerHeader = false,
}: WalletPinPromptHeaderProps) {
  return (
    <>
      {headerIcon}
      {headerAction ? (
        <Stack w="100%" flexDirection="row" jc="space-between" ai="center">
          <Heading heading={titleHeading} fontWeight={titleFontWeight} flexShrink={1}>
            {title}
          </Heading>
          {headerAction}
        </Stack>
      ) : (
        <Heading heading={titleHeading} fontWeight={titleFontWeight}>
          {title}
        </Heading>
      )}
      {annotation ? <Paragraph variant="annotation">{annotation}</Paragraph> : null}
      {subtitle ? <Paragraph ta={centerHeader ? 'center' : undefined}>{subtitle}</Paragraph> : null}
    </>
  )
}

export function WalletPinPromptInput({
  isLoading,
  onPinComplete,
  inputRef,
  onBiometricsTap,
  biometricsType,
}: WalletPinPromptInputProps) {
  return (
    <PinDotsInput
      onPinComplete={onPinComplete}
      isLoading={isLoading}
      pinLength={6}
      ref={inputRef}
      useNativeKeyboard={false}
      onBiometricsTap={onBiometricsTap}
      biometricsType={biometricsType}
    />
  )
}

export function WalletUnlockPromptInput({
  isLoading,
  onPinComplete,
  inputRef,
  onBiometricsTap,
  showBiometricUnlockAction,
  autoPromptBiometrics = true,
}: WalletUnlockPromptInputProps) {
  const biometricUnlockState = useBiometricUnlockState()
  const [isAllowedToAutoPromptBiometrics, setIsAllowedToAutoPromptBiometrics] = useState(false)
  const [shouldAutoPromptBiometrics, setShouldAutoPromptBiometrics] = useState(true)
  const hasAttemptedBiometricUnlockRef = useRef(false)
  const canUseBiometrics = showBiometricUnlockAction ?? biometricUnlockState.data?.canUnlockNow === true
  const biometricsType = getBiometricsType(biometricUnlockState.data?.biometryType)
  const shouldPromptBiometrics =
    autoPromptBiometrics &&
    canUseBiometrics &&
    isAllowedToAutoPromptBiometrics &&
    !isLoading &&
    shouldAutoPromptBiometrics &&
    !hasAttemptedBiometricUnlockRef.current

  const handlePinComplete = useCallback(
    (pin: string) => {
      setShouldAutoPromptBiometrics(false)
      onPinComplete(pin)
    },
    [onPinComplete]
  )

  const handleBiometricsTap = useCallback(() => {
    hasAttemptedBiometricUnlockRef.current = true
    setShouldAutoPromptBiometrics(false)
    void onBiometricsTap()
  }, [onBiometricsTap])

  useEffect(() => {
    const timer = setTimeout(() => setIsAllowedToAutoPromptBiometrics(true), 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (shouldPromptBiometrics) handleBiometricsTap()
  }, [handleBiometricsTap, shouldPromptBiometrics])

  return (
    <WalletPinPromptInput
      isLoading={isLoading}
      onPinComplete={handlePinComplete}
      inputRef={inputRef}
      onBiometricsTap={canUseBiometrics ? handleBiometricsTap : undefined}
      biometricsType={biometricsType}
    />
  )
}
