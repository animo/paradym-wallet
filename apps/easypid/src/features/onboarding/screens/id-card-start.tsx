import { Button, HeroIcons, IdCardImage, ScrollView, Spinner, XStack, YStack, useToastController } from '@package/ui'

import { IllustrationContainer } from '@package/ui'
import { useState } from 'react'
import { Platform } from 'react-native'
import { useCanUseSecureEnclave } from '../../../hooks/useCanUseSecureEnclave'

interface OnboardingIdCardStartScanProps {
  goToNextStep: (shouldUseCloudHsm: boolean) => Promise<void>
  onSkipCardSetup?: () => void
}

export function OnboardingIdCardStart({ goToNextStep, onSkipCardSetup }: OnboardingIdCardStartScanProps) {
  const [isLoading, setIsLoading] = useState(false)
  const canUseSecureEnclave = useCanUseSecureEnclave()
  const [shouldUseCloudHsm, setShouldUseCloudHsm] = useState(true)
  const toast = useToastController()

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

  const onSetupLater = () => {
    if (isLoading || !onSkipCardSetup) return

    setIsLoading(true)
    onSkipCardSetup()
    setIsLoading(false)
  }

  const onContinue = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep(shouldUseCloudHsm).finally(() => setIsLoading(false))
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack flex={1} overflow="hidden">
        <ScrollView alwaysBounceVertical={false}>
          <YStack gap="$2" pb="$4">
            <IllustrationContainer>
              <IdCardImage height={52} width={256} />
            </IllustrationContainer>
          </YStack>
        </ScrollView>
      </YStack>
      <YStack gap="$4" alignItems="center">
        {onSkipCardSetup && (
          <Button.Text disabled={isLoading} icon={HeroIcons.ArrowRight} scaleOnPress onPress={onSetupLater}>
            Set up later
          </Button.Text>
        )}
        <XStack gap="$2" width="100%">
          <Button.Outline scaleOnPress fg={0} width="$buttonHeight" onPress={onToggleCloudHsm}>
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
