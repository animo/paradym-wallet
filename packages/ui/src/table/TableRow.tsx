import { Paragraph, YStack, XStack } from '../base'
import { Image } from '../content'

interface TableRowProps {
  attribute: string
  // Value can be undefined if image prop is used
  value?: string
  image?: string
  isLastRow: boolean
  onPress?(): void
}

export const TableRow = ({ attribute, value, isLastRow, onPress, image }: TableRowProps) => {
  const renderedImage = image ? <Image src={image} width={50} height={50} /> : undefined
  return (
    <YStack
      px="$2.5"
      py="$2"
      key={attribute}
      borderBottomWidth={isLastRow ? 0 : 1}
      borderBottomColor="$grey-200"
      onPress={onPress}
      pressStyle={{
        opacity: 0.8,
      }}
    >
      <XStack f={1}>
        <YStack f={1} justifyContent="flex-start">
          <Paragraph variant="text" secondary>
            {attribute}
          </Paragraph>
          {value && <Paragraph>{value}</Paragraph>}
          {/* Render image on the left if no value */}
          {!value && renderedImage}
        </YStack>
        {/* Otherwise render image on the right */}
        {value && renderedImage}
      </XStack>
    </YStack>
  )
}
