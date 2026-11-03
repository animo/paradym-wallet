import { useLingui } from '@lingui/react/macro'
import { useImageScaler } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, HeroIcons, Spinner, XStack, YStack } from '@package/ui'
import { useState } from 'react'
import { Linking } from 'react-native'
import { ProtectData } from './assets/ProtectData'

interface OnboardingDataProtectionProps {
  goToNextStep: () => Promise<void>
}

export function OnboardingDataProtection({ goToNextStep }: OnboardingDataProtectionProps) {
  const { t } = useLingui()

  const { height, onLayout } = useImageScaler()
  const [isLoading, setIsLoading] = useState(false)

  const privacyButtonText = t({
    id: 'onboardingDataProtection.privacy',
    message: 'Read the Privacy Policy',
    comment: 'Button label to open the privacy policy',
  })

  const goToWalletLabel = t(commonMessages.goToWallet)

  const onContinue = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep().finally(() => setIsLoading(false))
  }

  const onPressPrivacy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  return (
    <YStack grow={1} justify="space-between">
      <YStack flex={1} items="center" onLayout={onLayout}>
        <YStack height={height} mt="5">
          <ProtectData />
        </YStack>
      </YStack>
      <YStack gap="5" alignItems="center">
        <Button.Text onPress={onPressPrivacy} icon={HeroIcons.Link} color="primary-500" py="2" textAlign="center">
          {privacyButtonText}
        </Button.Text>
        <XStack gap="2" width="100%">
          <Button.Solid scaleOnPress flexGrow={1} disabled={isLoading} onPress={onContinue}>
            {isLoading ? <Spinner variant="dark" /> : goToWalletLabel}
          </Button.Solid>
        </XStack>
      </YStack>
    </YStack>
  )
}
