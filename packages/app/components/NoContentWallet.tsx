import { Paragraph, Button, Heading, YStack } from '@internal/ui'
import { useRouter } from 'solito/router'

export default function NoContentWallet() {
  const { push } = useRouter()

  return (
    <YStack jc="center" ai="center" flex-1 space>
      <YStack jc="center" ai="center" gap="$2">
        <Heading variant="h2">This is your Wallet.</Heading>
        <Paragraph textAlign="center" secondary>
          Credentials will be shown here.
        </Paragraph>
      </YStack>
      <Button.Text onPress={() => push('/scan')}>Scan a QR code</Button.Text>
    </YStack>
  )
}
