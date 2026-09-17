import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Heading, LucideIcons, Paragraph, Spacer, YStack } from '@package/ui'
import { useRouter } from 'expo-router'

export function NoContentInbox() {
  const { back } = useRouter()
  const { t } = useLingui()

  return (
    <YStack jc="space-between" px="$4" height="80%">
      <Spacer />
      <YStack>
        <YStack jc="center" ai="center" gap="$2">
          <Heading heading="h2" fontWeight="$medium" letterSpacing={-0.5}>
            {t(commonMessages.noNotificationsTitle)}
          </Heading>
          <Paragraph textAlign="center" secondary>
            {t(commonMessages.noNotificationsDescription)}
          </Paragraph>
        </YStack>
        <Button.Text fontWeight="$medium" onPress={() => back()} icon={<LucideIcons.ArrowLeft size={20} margin={-4} />}>
          <Trans id="noContentInbox.goBack" comment="Label for the go back button">
            Go back
          </Trans>
        </Button.Text>
      </YStack>
      <Spacer size="$8" />
    </YStack>
  )
}
