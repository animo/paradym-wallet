import { YStack, Paragraph, XStack, borderRadiusSizes, paddingSizes } from '@internal/ui'

import { sanitizeString } from 'app/utils/format'

type CredentialAttributesProps = {
  subject: Record<string, string>
}
// FIXME: Record can be nested.
export default function CredentialAttributes({ subject }: CredentialAttributesProps) {
  return (
    <YStack g="md">
      <Paragraph>Information</Paragraph>
      <YStack border br={borderRadiusSizes.lg} bg="$white">
        {Object.keys(subject).map((x, index) => (
          <XStack
            pad="md"
            px={paddingSizes.lg}
            key={x}
            jc="center"
            ai="center"
            borderBottomWidth={index === Object.keys(subject).length - 1 ? 0 : 1}
            borderBottomColor="$grey-300"
          >
            <Paragraph numberOfLines={1} f={1}>
              {sanitizeString(x)}
            </Paragraph>
            <Paragraph secondary f={1} flexGrow={1} numberOfLines={1} textAlign="right">
              {typeof subject[x] === 'string' ? subject[x] : JSON.stringify(subject[x])}
            </Paragraph>
          </XStack>
        ))}
      </YStack>
    </YStack>
  )
}
