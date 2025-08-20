import { resetAppState } from '@easypid/utils/resetAppState'
import { Button, FlexPage, Heading, Paragraph, YStack } from '@package/ui'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'

export const FunkePinLockedScreen = () => {
  const { paradym } = useParadym('unlocked')
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
          paradym.reset().then(() => {
            resetAppState()
            router.replace('onboarding')
          })
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
