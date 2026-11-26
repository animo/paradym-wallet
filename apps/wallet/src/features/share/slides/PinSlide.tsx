import { useBiometricsType } from '@app/hooks/useBiometricsType'
import { Trans, useLingui } from '@lingui/react/macro'
import { PinDotsInput, type PinDotsInputRef, useWizard } from '@package/app'
import { Heading, Paragraph, ScrollView, useIsAccessibilityTextSize, YStack } from '@package/ui'
import { useCanUseBiometryBackedWalletKey, useIsBiometricsEnabled } from '@paradym/wallet-sdk'
import { useRef, useState } from 'react'
import { validateWalletBiometrics } from '../../../crypto/walletPin'

export interface OnPinSubmitProps {
  pin?: string
  /** The user confirmed with the biometric that guards the wallet key, which was checked like a PIN. */
  confirmedWithBiometrics?: boolean
  onPinComplete?: () => void
  onPinError?: () => void
}

export interface PinSlideProps {
  onPinSubmit: ({ pin, onPinComplete, onPinError }: OnPinSubmitProps) => Promise<void>
  isLoading: boolean
  /** A payment, mandate or other transaction is confirmed rather than data sent. */
  isTransaction?: boolean
}

export const PinSlide = ({ onPinSubmit, isLoading, isTransaction = false }: PinSlideProps) => {
  const { onNext } = useWizard()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)
  const { t } = useLingui()
  const biometricsType = useBiometricsType()
  const [isBiometricsEnabled] = useIsBiometricsEnabled()
  const canUseBiometryBackedWalletKey = useCanUseBiometryBackedWalletKey()
  const isAccessibilityTextSize = useIsAccessibilityTextSize()

  // A cancelled or failed prompt leaves the PIN pad, so the user can still type their PIN.
  const confirmWithBiometrics = async () => {
    setIsSubmitting(true)
    try {
      await validateWalletBiometrics({
        title: t({
          id: 'pinSlide.biometricsPromptTitle',
          message: 'Confirm request',
          comment: 'Title of the system biometric prompt that confirms sharing or paying instead of the PIN',
        }),
      })
    } catch {
      setIsSubmitting(false)
      return
    }

    onPinSubmit({ confirmedWithBiometrics: true, onPinComplete: () => onNext() }).finally(() => setIsSubmitting(false))
  }

  const onPinEnterComplete = (pin: string) => {
    setIsSubmitting(true)

    onPinSubmit({
      pin,
      onPinComplete: () => onNext(),
      onPinError: () => {
        pinRef.current?.shake()
        pinRef.current?.clear()
      },
    }).finally(() => setIsSubmitting(false))
  }

  return (
    // The step scrolls its own content: only the text scrolls when it doesn't fit, so the pad stays on screen at
    // large text sizes
    <YStack flex={1} justify="space-between">
      <ScrollView grow={0} flexShrink={1} contentContainerStyle={{ gap: '5' }}>
        <Heading>
          {isTransaction ? (
            <Trans
              id="pinSlide.transactionTitle"
              comment="Heading shown when user is asked to enter their app PIN to confirm a payment, mandate or other transaction"
            >
              Confirm with your PIN code
            </Trans>
          ) : (
            <Trans
              id="pinSlide.title"
              comment="Heading shown when user is asked to enter their app PIN to confirm a request"
            >
              Send data with your PIN code
            </Trans>
          )}
        </Heading>
        <Paragraph>
          <Trans id="pinSlide.description" comment="Supporting text explaining why PIN is needed">
            Use your app PIN code to confirm the request.
          </Trans>
        </Paragraph>
      </ScrollView>
      <YStack grow={1} flexShrink={0} mt={isAccessibilityTextSize ? 20 : 60}>
        <PinDotsInput
          onPinComplete={onPinEnterComplete}
          isLoading={isLoading || isSubmitting}
          pinLength={6}
          ref={pinRef}
          useNativeKeyboard={false}
          onBiometricsTap={isBiometricsEnabled && canUseBiometryBackedWalletKey ? confirmWithBiometrics : undefined}
          biometricsType={biometricsType}
        />
      </YStack>
    </YStack>
  )
}
