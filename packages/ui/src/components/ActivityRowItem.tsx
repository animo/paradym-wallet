import { formatRelativeDate } from '@package/utils'
import { Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons } from '../content'

const interactionIcons = {
  received: HeroIcons.CreditCard,
  shared: HeroIcons.Interaction,
}

const title = {
  received: 'Received credential',
  shared: 'Shared data',
}

export function ActivityRowItem({
  subtitle,
  date,
  type = 'shared',
}: { title: string; subtitle: string; date: Date; type?: 'shared' | 'received' }) {
  const Icon = interactionIcons[type]
  const Title = title[type]

  return (
    <XStack gap="$4" w="100%">
      <Stack jc="center" ai="center" w={52} h={52} br="$12" bg="$primary-500" p="$4">
        <Icon color="$white" />
      </Stack>
      <YStack gap="$1" jc="space-between" fg={1} w="75%">
        <XStack jc="space-between">
          <Paragraph color="$grey-600">{Title}</Paragraph>
          <Paragraph variant="annotation" color="$grey-600" fontWeight="$regular">
            {formatRelativeDate(date)}
          </Paragraph>
        </XStack>
        <Paragraph numberOfLines={1} fontWeight="$semiBold" fontSize="$4" color="$grey-900">
          {subtitle}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
