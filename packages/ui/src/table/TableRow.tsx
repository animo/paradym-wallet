import { Paragraph, XStack, YStack } from '../base'
import { Image } from '../content'

interface TableRowProps {
  attributes?: string | string[]
  values?: string | string[] | React.ReactNode
  image?: string
  isLastRow?: boolean
  centred?: boolean
  onPress?(): void
}

// FIXME: Use combined values so you have one array with objects where the keys are key and value for example.
export const TableRow = ({ attributes, values, isLastRow = false, onPress, image, centred = false }: TableRowProps) => {
  const renderedImage = image ? <Image src={image} width={50} height={50} /> : undefined
  const attributesArray = Array.isArray(attributes) ? attributes : [attributes]
  const valuesArray = Array.isArray(values) ? values : [values]

  return (
    <YStack
      px="$2.5"
      py="$2"
      borderBottomWidth={isLastRow ? 0 : 2}
      borderBottomColor="$tableBorderColor"
      backgroundColor="$tableBackgroundColor"
      onPress={onPress}
      pressStyle={{
        opacity: onPress ? 0.8 : 1,
      }}
    >
      <XStack f={1} alignItems="center" gap="$4">
        {attributesArray.map((attr, index) => (
          <YStack
            key={attr}
            borderRightWidth={2}
            borderRightColor={index === attributesArray.length - 1 ? 'transparent' : '$white'}
            my="$-2"
            py="$2"
            f={1}
            gap="$1.5"
            ai={centred ? 'center' : 'flex-start'}
            justifyContent="flex-start"
          >
            {attr && (
              <Paragraph variant="annotation" color="$grey-600" fontWeight="$medium">
                {attr}
              </Paragraph>
            )}
            {valuesArray[index] && <Paragraph color="$grey-900">{valuesArray[index]}</Paragraph>}
            {/* Render image on the left if no value */}
            {!valuesArray[index] && renderedImage}
          </YStack>
        ))}
        {/* Otherwise render image on the right */}
        {valuesArray[0] && renderedImage}
      </XStack>
    </YStack>
  )
}
