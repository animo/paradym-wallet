import { useMedia } from 'tamagui'
import { Heading, Stack, YStack } from '../base'
interface HeaderContainerProps {
  isScrolledByOffset?: boolean
  title?: string
}

export function HeaderContainer({ isScrolledByOffset, title }: HeaderContainerProps) {
  const media = useMedia()

  const titleContainer = title ? (
    <YStack py={media.short ? '$2' : '$4'} px="$4" gap="$2">
      <Stack h={media.short ? '$1' : '$3'} />
      <Heading variant="h1">{title}</Heading>
    </YStack>
  ) : null

  return (
    <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
      {titleContainer}
    </YStack>
  )
}
