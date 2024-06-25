import { Button, Heading, Paragraph, Spacer, YStack } from '@package/ui'
import { useRouter } from 'solito/router'

export function NoContentWallet() {
  const { push } = useRouter()

  return (
    <YStack jc="space-between" px="$4" height="95%">
      <Spacer />
      <YStack>
        <YStack jc="center" ai="center" gap="$2">
          <Heading variant="h2">This is your wallet</Heading>
          <Paragraph textAlign="center" secondary>
            Credentials will be shown here.
          </Paragraph>
        </YStack>
        <Button.Text onPress={() => push('/scan')}>Scan a QR code</Button.Text>
      </YStack>
      <Spacer size="$8" />
    </YStack>
  )
}
