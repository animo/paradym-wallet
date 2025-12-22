import { Stack, YStack } from '@package/ui'
import { Image } from '@package/ui/content/Image'

interface MiniDocumentProps {
  logoUrl?: string
}

export function MiniDocument({ logoUrl }: MiniDocumentProps) {
  return (
    <YStack w="$5" rotate="3deg" shadow>
      <YStack bg="$white" p="$2" gap="$2" br="$3" bw={1} borderColor="$grey-200">
        {!logoUrl ? (
          <Stack ai="center" h="$1" br="$2" bg="$grey-200" />
        ) : (
          <Stack ai="center" h="$1" br="$2" bg="$primary-200">
            <Stack pos="absolute" p="$1">
              <Image src={logoUrl} height={16} width={16} />
            </Stack>
          </Stack>
        )}
        <YStack gap="$1.5">
          <Stack h="$0.5" br="$2" bg="$grey-100" />
          <Stack h="$0.5" br="$2" bg="$grey-100" />
          <Stack h="$0.5" br="$2" bg="$grey-100" />
        </YStack>
      </YStack>
    </YStack>
  )
}
