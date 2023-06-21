import { Paragraph, Button, Heading, YStack, Spacer } from '@internal/ui'
import { useRouter } from 'solito/router'

export default function NoContentWallet() {
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
      <Spacer size="$12" />
    </YStack>
  )
}
