import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Heading, Paragraph, Spacer, YStack } from '@package/ui'
import { useRouter } from 'expo-router'

export function NoContentWallet() {
  const { push } = useRouter()
  const { t } = useLingui()

  return (
    <YStack jc="space-between" px="$4" height="95%">
      <Spacer />
      <YStack>
        <YStack jc="center" ai="center" gap="$2">
          <Heading heading="h2" fontWeight="$medium" letterSpacing={-0.5}>
            {t(commonMessages.thisIsYourWallet)}
          </Heading>
          <Paragraph textAlign="center" secondary>
            <Trans id="noContentWallet.message" comment="Message shown when wallet has no credentials">
              Credentials will be shown here.
            </Trans>
          </Paragraph>
        </YStack>
        <Button.Text fontWeight="$medium" onPress={() => push('/scan')}>
          <Trans id="noContentWallet.scanButton" comment="Label for button to scan a QR code">
            Scan a QR code
          </Trans>
        </Button.Text>
      </YStack>
      <Spacer size="$8" />
    </YStack>
  )
}
