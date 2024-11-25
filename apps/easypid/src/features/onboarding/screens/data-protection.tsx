import { useCanUseSecureEnclave } from '@easypid/hooks/useCanUseSecureEnclave'
import { Button, HeroIcons, Spinner, XStack, YStack, useToastController } from '@package/ui'
import { useImageScaler } from 'packages/app/src/hooks'
import React, { useState } from 'react'
import { Linking, Platform } from 'react-native'
import { ProtectData } from './assets/ProtectData'

interface OnboardingDataProtectionProps {
  goToNextStep: (shouldUseCloudHsm: boolean) => Promise<void>
}

export function OnboardingDataProtection({ goToNextStep }: OnboardingDataProtectionProps) {
  const toast = useToastController()
  const canUseSecureEnclave = useCanUseSecureEnclave()
  const [shouldUseCloudHsm, setShouldUseCloudHsm] = useState(true)

  const { height, onLayout } = useImageScaler()
  const [isLoading, setIsLoading] = useState(false)

  const onContinue = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep(shouldUseCloudHsm).finally(() => setIsLoading(false))
  }

  const onToggleCloudHsm = () => {
    const newShouldUseCloudHsm = !shouldUseCloudHsm

    if (newShouldUseCloudHsm === false && !canUseSecureEnclave) {
      toast.show(`You device does not support on-device ${Platform.OS === 'ios' ? 'Secure Enclave' : 'Strongbox'}.`, {
        message: 'Only Cloud HSM supported for PID cryptogrpahic keys.',
        customData: {
          preset: 'danger',
        },
      })
      return
    }

    toast.show(
      newShouldUseCloudHsm
        ? 'Now using Cloud HSM for PID cryptographic keys.'
        : `Now using ${Platform.OS === 'ios' ? 'Secure Enclave' : 'Strongbox'} for PID cryptographic keys.`,
      {
        customData: {
          preset: 'none',
        },
      }
    )

    setShouldUseCloudHsm(newShouldUseCloudHsm)
  }

  const onPressPrivacy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack f={1} ai="center" onLayout={onLayout}>
        <YStack height={height} mt="$4">
          <ProtectData />
        </YStack>
      </YStack>
      <YStack gap="$4" alignItems="center">
        <Button.Text onPress={onPressPrivacy} icon={HeroIcons.Link} color="$primary-500" py="$2" textAlign="center">
          Read the Privacy Policy
        </Button.Text>
        <XStack gap="$2" width="100%">
          <Button.Outline bg="$grey-100" scaleOnPress fg={0} width="$buttonHeight" onPress={onToggleCloudHsm}>
            {shouldUseCloudHsm ? <HeroIcons.Cloud /> : <HeroIcons.DevicePhoneMobile />}
          </Button.Outline>
          <Button.Solid scaleOnPress flexGrow={1} disabled={isLoading} onPress={onContinue}>
            {isLoading ? <Spinner variant="dark" /> : 'Continue'}
          </Button.Solid>
        </XStack>
      </YStack>
    </YStack>
  )
}