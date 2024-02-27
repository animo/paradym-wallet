import { Paragraph, Button, Heading, YStack } from '@internal/ui'
import { useRouter } from 'solito/router'

export default function NoContentInbox() {
  const { back } = useRouter()

  return (
    <YStack px="$4" height="100%" jc="center">
      <YStack jc="center" ai="center" gap="$2">
        <Heading variant="h2">You're all caught up.</Heading>
        <Paragraph textAlign="center" secondary>
          You don't have any notifications at the moment.
        </Paragraph>
      </YStack>
      <Button.Text onPress={() => back()}>Go back</Button.Text>
    </YStack>
  )
}
