import { isLocalSecureEnvironmentSupported } from '@animo-id/expo-secure-environment'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useLingui } from '@lingui/react/macro'
import { useImageScaler } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, HeroIcons, Spinner, XStack, YStack, useToastController } from '@package/ui'
import { useState } from 'react'
import { Linking, Platform } from 'react-native'
import { ProtectData } from './assets/ProtectData'

interface OnboardingDataProtectionProps {
  goToNextStep: (shouldUseCloudHsm: boolean) => Promise<void>
}

export function OnboardingDataProtection({ goToNextStep }: OnboardingDataProtectionProps) {
  const { t } = useLingui()
  const toast = useToastController()
  const [shouldUseCloudHsm, setShouldUseCloudHsm] = useState(true)
  const isCloudHsmFeatureEnabled = useFeatureFlag('CLOUD_HSM')

  const { height, onLayout } = useImageScaler()
  const [isLoading, setIsLoading] = useState(false)

  const cloudHsmToast = t({
    id: 'onboardingDataProtection.toast.cloudHsm',
    message: 'Now using Cloud HSM for PID cryptographic keys.',
    comment: 'Toast shown when Cloud HSM is selected for key storage',
  })

  const secureStorageToast = t({
    id: 'onboardingDataProtection.toast.secureDevice',
    message: `Now using ${Platform.OS === 'ios' ? 'Secure Enclave' : 'Strongbox'} for PID cryptographic keys.`,
    comment: 'Toast shown when switching to local secure storage (e.g. Secure Enclave or Strongbox)',
  })

  const privacyButtonText = t({
    id: 'onboardingDataProtection.privacy',
    message: 'Read the Privacy Policy',
    comment: 'Button label to open the privacy policy',
  })

  const continueLabel = t(commonMessages.continue)
  const goToWalletLabel = t(commonMessages.goToWallet)

  const onContinue = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep(shouldUseCloudHsm).finally(() => setIsLoading(false))
  }

  const onToggleCloudHsm = () => {
    if (isLoading) return
    const newShouldUseCloudHsm = !shouldUseCloudHsm

    toast.show(newShouldUseCloudHsm ? cloudHsmToast : secureStorageToast, {
      customData: {
        preset: 'none',
      },
    })

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
          {privacyButtonText}
        </Button.Text>
        <XStack gap="$2" width="100%">
          {isCloudHsmFeatureEnabled && (
            <Button.Outline
              bg="$grey-100"
              scaleOnPress
              width="$buttonHeight"
              onPress={onToggleCloudHsm}
              disabled={!isLocalSecureEnvironmentSupported()}
            >
              {shouldUseCloudHsm ? <HeroIcons.Cloud /> : <HeroIcons.DevicePhoneMobile />}
            </Button.Outline>
          )}
          <Button.Solid scaleOnPress flexGrow={1} disabled={isLoading} onPress={onContinue}>
            {isLoading ? <Spinner variant="dark" /> : isCloudHsmFeatureEnabled ? continueLabel : goToWalletLabel}
          </Button.Solid>
        </XStack>
      </YStack>
    </YStack>
  )
}
