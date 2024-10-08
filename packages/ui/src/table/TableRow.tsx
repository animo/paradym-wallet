import { Heading, Paragraph, XStack, YStack } from '../base'
import { Image } from '../content'

interface TableRowProps {
  // attribute can be undefined for array values
  attribute?: string
  // Value can be undefined if image prop is used
  value?: string
  image?: string
  isLastRow: boolean
  onPress?(): void
  variant?: 'card' | 'free'
}

export const TableRow = ({ variant = 'card', attribute, value, isLastRow, onPress, image }: TableRowProps) => {
  const renderedImage = image ? <Image src={image} width={50} height={50} /> : undefined

  if (variant === 'card') {
    return (
      <YStack
        px="$2.5"
        py="$2"
        key={attribute}
        borderBottomWidth={isLastRow ? 0 : 1}
        borderBottomColor="$tableBorderColor"
        backgroundColor="$tableBackgroundColor"
        onPress={onPress}
        pressStyle={{
          opacity: 0.8,
        }}
      >
        <XStack f={1}>
          <YStack gap="$1.5" f={1} justifyContent="flex-start">
            {attribute && <Paragraph variant="annotation">{attribute}</Paragraph>}
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

  return (
    <YStack
      key={attribute}
      onPress={onPress}
      pressStyle={{
        opacity: 0.8,
      }}
    >
      <XStack f={1}>
        <YStack gap="$1.5" f={1} justifyContent="flex-start">
          {attribute && <Paragraph variant="annotation">{attribute}</Paragraph>}
          {value && <Heading variant="sub2">{value}</Heading>}
          {/* Render image on the left if no value */}
          {!value && renderedImage}
        </YStack>
        {/* Otherwise render image on the right */}
        {value && renderedImage}
      </XStack>
    </YStack>
  )
}
