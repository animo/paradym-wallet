import { Paragraph, XStack, YStack } from '../base'
import { Image } from '../content'

interface TableRowProps {
  // attribute can be undefined for array values
  attribute?: string
  // Value can be undefined if image prop is used
  value?: string
  image?: string
  isLastRow: boolean
  onPress?(): void
  borderStyle?: 'large' | 'small'
  attributeWeight?: 'regular' | 'medium'
}

export const TableRow = ({
  attribute,
  value,
  isLastRow,
  onPress,
  image,
  borderStyle,
  attributeWeight,
}: TableRowProps) => {
  const renderedImage = image ? <Image src={image} width={50} height={50} /> : undefined

  return (
    <YStack
      px="$2.5"
      py="$2"
      key={attribute}
      borderBottomWidth={isLastRow ? 0 : borderStyle === 'large' ? 2 : 1}
      borderBottomColor="$tableBorderColor"
      backgroundColor="$tableBackgroundColor"
      onPress={onPress}
      pressStyle={{
        opacity: onPress ? 0.8 : 1,
      }}
    >
      <XStack f={1} alignItems="center">
        <YStack gap="$1.5" f={1} justifyContent="flex-start">
          {attribute && (
            <Paragraph
              variant="annotation"
              color="$grey-600"
              fontWeight={attributeWeight === 'medium' ? '$medium' : '$regular'}
            >
              {attribute}
            </Paragraph>
          )}
          {value && <Paragraph color="$grey-900">{value}</Paragraph>}
          {/* Render image on the left if no value */}
          {!value && renderedImage}
        </YStack>
        {/* Otherwise render image on the right */}
        {value && renderedImage}
      </XStack>
    </YStack>
  )
}
