import { Trans } from '@lingui/react/macro'
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
            <Trans id="noContentInbox.heading" comment="Heading shown when user has no notifications">
              You're all caught up
            </Trans>
          </Heading>
          <Paragraph textAlign="center" secondary>
            <Trans id="noContentInbox.message" comment="Message shown when user has no notifications">
              You don't have any notifications at the moment.
            </Trans>
          </Paragraph>
        </YStack>
        <Button.Text fontWeight="$medium" onPress={() => back()} icon={<LucideIcons.ArrowLeft size={20} m={-4} />}>
          <Trans id="noContentInbox.goBack" comment="Label for the go back button">
            Go back
          </Trans>
        </Button.Text>
      </YStack>
      <Spacer size="$8" />
    </YStack>
  )
}
