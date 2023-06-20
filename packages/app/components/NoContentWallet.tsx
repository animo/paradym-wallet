import { Paragraph, Button, Heading, YStack, XStack, Scan, ScrollView } from '@internal/ui'
import { useRouter } from 'solito/router'

import { useNetworkCallback } from 'app/hooks/useNetworkCallback'

export default function NoContentWallet() {
  const { push } = useRouter()
  const navigateToScanner = useNetworkCallback(() => push('/scan'))

  return (
    <ScrollView space px="$4" contentContainerStyle={{ height: '100%' }}>
      <XStack jc="space-between" ai="center">
        <Heading variant="title" textAlign="left">
          Wallet
        </Heading>
        <XStack onPress={() => navigateToScanner()} pad="md">
          <Scan />
        </XStack>
      </XStack>
      <YStack jc="center" ai="center" gap="$2">
        <Heading variant="h2">This is your Wallet.</Heading>
        <Paragraph textAlign="center" secondary>
          Credentials will be shown here.
        </Paragraph>
      </YStack>
      <Button.Text onPress={() => push('/scan')}>Scan a QR code</Button.Text>
    </ScrollView>
  )
}
