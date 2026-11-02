import { Stack, YStack } from '@package/ui'
import { Image } from '@package/ui/content/Image'

interface MiniDocumentProps {
  logoUrl?: string
}

export function MiniDocument({ logoUrl }: MiniDocumentProps) {
  return (
    <YStack w={52} rotate="3deg" shadow>
      <YStack bg="white" p="2" gap="2" rounded="3" borderWidth={1} borderColor="grey-200">
        {!logoUrl ? (
          <Stack items="center" h="5" rounded="2" bg="grey-200" />
        ) : (
          <Stack items="center" h="5" rounded="2" bg="primary-200">
            <Stack position="absolute" p="0-5">
              <Image src={logoUrl} height={16} width={16} />
            </Stack>
          </Stack>
        )}
        <YStack gap="1">
          <Stack h="1" rounded="2" bg="grey-100" />
          <Stack h="1" rounded="2" bg="grey-100" />
          <Stack h="1" rounded="2" bg="grey-100" />
        </YStack>
      </YStack>
    </YStack>
  )
}
