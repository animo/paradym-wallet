import { useMedia } from 'tamagui'
import { Heading, Stack, YStack } from '../base'
interface HeaderContainerProps {
  isScrolledByOffset?: boolean
  title?: string
  subtitle?: string
}

export function HeaderContainer({ isScrolledByOffset, title, subtitle }: HeaderContainerProps) {
  const media = useMedia()

  const titleContainer = title ? (
    <YStack py={media.short ? '$3' : '$4'} px="$4" gap="$2">
      <Stack h={media.short ? '$2' : '$3'} />
      {subtitle && (
        <Heading heading="sub2" secondary>
          {subtitle}
        </Heading>
      )}
      <Heading heading="h1">{title}</Heading>
    </YStack>
  ) : null

  return (
    <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
      {titleContainer}
    </YStack>
  )
}
