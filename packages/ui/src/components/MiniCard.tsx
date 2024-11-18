import { Stack } from '../base'
import { Image } from '../content'

interface MiniCardProps {
  backgroundImage?: string | number | undefined
  backgroundColor: string
  hasInternet?: boolean
}

export function MiniCard({ backgroundImage, backgroundColor, hasInternet }: MiniCardProps) {
  return (
    <Stack p="$2" h="$8" w="$12" br="$4" overflow="hidden" pos="relative" bg={backgroundColor ?? '$grey-900'}>
      {hasInternet && backgroundImage && (
        <Stack pos="absolute" top={0} left={0} right={0} bottom={0}>
          <Image src={backgroundImage} alt="Card" resizeMode="cover" height="100%" width="100%" />
        </Stack>
      )}
    </Stack>
  )
}
