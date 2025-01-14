import { useSecureUnlock } from '@easypid/agent'
import { resetWallet } from '@easypid/utils/resetWallet'
import { Button, FlexPage, Heading, Paragraph, YStack } from '@package/ui'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'

export const FunkePinLockedScreen = () => {
  const secureUnlock = useSecureUnlock()
  const router = useRouter()

  const onResetWallet = () => {
    Alert.alert('Reset Wallet', 'Are you sure you want to reset the wallet?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          resetWallet(secureUnlock).then(() => router.replace('onboarding'))
        },
      },
    ])
  }

  return (
    <FlexPage gap="$2" jc="space-between">
      <YStack fg={1} gap="$6" mt="$6">
        <YStack gap="$6">
          <Heading variant="h1">Too many incorrect attempts</Heading>
          <Paragraph color="$grey-700">
            You have entered an incorrect PIN. The wallet was locked, please reset it to set a new PIN and continue.
          </Paragraph>
        </YStack>
      </YStack>
      <Button.Solid onPress={onResetWallet}>Reset Wallet</Button.Solid>
    </FlexPage>
  )
}
