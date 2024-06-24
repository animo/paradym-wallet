import { Button, Heading, Paragraph, Spacer, YStack } from '@package/ui'
import { useRouter } from 'solito/router'

export function NoContentInbox() {
  const { back } = useRouter()

  return (
    <YStack jc="space-between" px="$4" height="95%">
      <Spacer />
      <YStack>
        <YStack jc="center" ai="center" gap="$2">
          <Heading variant="h2">You're all caught up.</Heading>
          <Paragraph textAlign="center" secondary>
            You don't have any notifications at the moment.
          </Paragraph>
        </YStack>
        <Button.Text onPress={() => back()}>Go back</Button.Text>
      </YStack>
      <Spacer size="$8" />
    </YStack>
  )
}
