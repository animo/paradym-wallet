import { Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons } from '../content'

const interactionIcons = {
  shared: HeroIcons.Interaction,
}

export function ActivityRowItem({
  title,
  subtitle,
  date,
  type = 'shared',
}: { title: string; subtitle: string; date: string; type?: 'shared' }) {
  const Icon = interactionIcons[type]

  return (
    <XStack gap="$4" w="100%">
      <Stack jc="center" ai="center" w={52} h={52} br="$12" bg="$primary-500" p="$4">
        <Icon color="$white" />
      </Stack>
      <YStack gap="$1" jc="space-between" fg={1} w="75%">
        <XStack jc="space-between">
          <Paragraph color="$grey-700" fontWeight="$semiBold">
            {title}
          </Paragraph>
          <Paragraph variant="sub" color="$grey-600" fontWeight="$regular">
            {date}
          </Paragraph>
        </XStack>
        <Paragraph numberOfLines={1} fontWeight="$semiBold" fontSize="$4" color="$grey-900">
          {subtitle}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
