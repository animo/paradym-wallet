import { Paragraph, Button, Heading, YStack, XStack, Scan, Spacer } from '@internal/ui'
import { useRouter } from 'solito/router'

import { useNetworkCallback } from 'app/hooks/useNetworkCallback'

export default function NoContentWallet() {
  const { push } = useRouter()
  const navigateToScanner = useNetworkCallback(() => push('/scan'))

  return (
    <YStack jc="space-between" px="$4" height="95%">
      <XStack jc="space-between" ai="center">
        <Heading variant="title" textAlign="left">
          Credentials
        </Heading>
        <XStack onPress={() => navigateToScanner()} pad="md">
          <Scan />
        </XStack>
      </XStack>
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
