import { resetAppState } from '@easypid/utils/resetAppState'
import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, FlexPage, Heading, Paragraph, YStack } from '@package/ui'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'

export const FunkePinLockedScreen = () => {
  const { paradym } = useParadym('unlocked')
  const router = useRouter()
  const { t } = useLingui()

  const onResetWallet = () => {
    Alert.alert(
      t(commonMessages.reset),
      t({
        id: 'pinLocked.alertMessage',
        message: 'Are you sure you want to reset the wallet?',
        comment: 'Message body of the confirmation dialog (action button) for wallet reset',
      }),
      [
        {
          style: 'cancel',
          text: t(commonMessages.yes),
          onPress: () => {
            paradym.reset().then(() => {
              resetAppState()
              router.replace('onboarding')
            })
          },
        },
      ]
    )
  }

  return (
    <FlexPage gap="$2" jc="space-between">
      <YStack fg={1} gap="$6" mt="$6">
        <YStack gap="$6">
          <Heading heading="h1">
            <Trans id="pinLocked.title" comment="Heading shown when the user has entered too many incorrect PINs">
              Too many incorrect attempts
            </Trans>
          </Heading>
          <Paragraph color="$grey-700">
            <Trans
              id="pinLocked.description"
              comment="Descriptive text explaining that the wallet is locked and must be reset"
            >
              You have entered an incorrect PIN. The wallet was locked, please reset it to set a new PIN and continue.
            </Trans>
          </Paragraph>
        </YStack>
      </YStack>
      <Button.Solid onPress={onResetWallet}>{t(commonMessages.reset)}</Button.Solid>
    </FlexPage>
  )
}
