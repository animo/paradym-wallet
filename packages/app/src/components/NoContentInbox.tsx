import { Button, Heading, LucideIcons, Paragraph, Spacer, YStack } from '@package/ui'
import { useRouter } from 'expo-router'

export function NoContentInbox() {
  const { back } = useRouter()

  return (
    <YStack jc="space-between" px="$4" height="80%">
      <Spacer />
      <YStack>
        <YStack jc="center" ai="center" gap="$2">
          <Heading variant="h2" fontWeight="$medium" letterSpacing={-0.5}>
            You're all caught up
          </Heading>
          <Paragraph textAlign="center" secondary>
            You don't have any notifications at the moment.
          </Paragraph>
        </YStack>
        <Button.Text fontWeight="$medium" onPress={() => back()} icon={<LucideIcons.ArrowLeft size={20} m={-4} />}>
          Go back
        </Button.Text>
      </YStack>
      <Spacer size="$8" />
    </YStack>
  )
}
