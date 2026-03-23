import { useEffect, useState } from 'react'
import { Paragraph, XStack, YStack } from '../base'
import { Image } from '../content'

interface TableRowProps {
  attributes?: string | string[]
  values?: string | string[] | React.ReactNode
  image?: string
  isLastRow?: boolean
  centred?: boolean
  onPress?(): void
  variant?: 'vertical' | 'horizontal'
}

// FIXME: Use combined values so you have one array with objects where the keys are key and value for example.
export const TableRow = ({
  attributes,
  values,
  isLastRow = false,
  onPress,
  image,
  centred = false,
  variant = 'vertical',
}: TableRowProps) => {
  const DENSE_KEY_SINGLE_LINE_HEIGHT = 20
  const DENSE_VALUE_SINGLE_LINE_HEIGHT = 28

  const renderedImage = image ? <Image src={image} width={50} height={50} /> : undefined
  const attributesArray = Array.isArray(attributes) ? attributes : [attributes]
  const valuesArray = Array.isArray(values) ? values : [values]
  const horizontalAttribute = attributesArray[0]
  const horizontalValue = valuesArray[0]
  const [useDenseHorizontalLayout, setUseDenseHorizontalLayout] = useState(true)
  const [renderedAttributeHeight, setRenderedAttributeHeight] = useState<number | null>(null)
  const [renderedValueHeight, setRenderedValueHeight] = useState<number | null>(null)
  const [renderedAttributeY, setRenderedAttributeY] = useState<number | null>(null)
  const [renderedValueY, setRenderedValueY] = useState<number | null>(null)

  const canMeasureHorizontalDensity =
    variant === 'horizontal' && typeof horizontalAttribute === 'string' && typeof horizontalValue === 'string'

  useEffect(() => {
    if (variant === 'horizontal') {
      setUseDenseHorizontalLayout(true)
      setRenderedAttributeHeight(null)
      setRenderedValueHeight(null)
      setRenderedAttributeY(null)
      setRenderedValueY(null)
    }
  }, [variant, horizontalAttribute, horizontalValue])

  useEffect(() => {
    if (!canMeasureHorizontalDensity || !useDenseHorizontalLayout) return
    if (
      renderedAttributeHeight === null ||
      renderedValueHeight === null ||
      renderedAttributeY === null ||
      renderedValueY === null
    ) {
      return
    }

    // If either text wraps to multiple lines or the value wraps to a new row,
    // switch this row to the non-dense layout.
    const renderedMoreThanSingleLine =
      renderedAttributeHeight > DENSE_KEY_SINGLE_LINE_HEIGHT + 1 ||
      renderedValueHeight > DENSE_VALUE_SINGLE_LINE_HEIGHT + 1
    const renderedOnMultipleRows = renderedValueY > renderedAttributeY + 1

    if (renderedMoreThanSingleLine || renderedOnMultipleRows) {
      setUseDenseHorizontalLayout(false)
    }
  }, [
    canMeasureHorizontalDensity,
    useDenseHorizontalLayout,
    renderedAttributeHeight,
    renderedValueHeight,
    renderedAttributeY,
    renderedValueY,
  ])

  if (variant === 'horizontal') {
    if (!useDenseHorizontalLayout) {
      return (
        <YStack
          py="$3"
          px="$4"
          borderBottomWidth={isLastRow ? 0 : 1}
          borderBottomColor="$tableBorderColor"
          backgroundColor="$tableBackgroundColor"
          onPress={onPress}
          pressStyle={{
            opacity: onPress ? 0.8 : 1,
          }}
          gap="$1.5"
        >
          {horizontalAttribute && (
            <Paragraph variant="sub" color="$grey-600" fontWeight="$medium" w="100%">
              {horizontalAttribute}
            </Paragraph>
          )}
          {horizontalValue && (
            <Paragraph color="$grey-900" fontWeight="$semiBold" textAlign="justify" w="100%">
              {horizontalValue}
            </Paragraph>
          )}
          {renderedImage}
        </YStack>
      )
    }

    return (
      <YStack
        py="$3"
        px="$4"
        borderBottomWidth={isLastRow ? 0 : 1}
        borderBottomColor="$tableBorderColor"
        backgroundColor="$tableBackgroundColor"
        onPress={onPress}
        pressStyle={{
          opacity: onPress ? 0.8 : 1,
        }}
      >
        <XStack f={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$2">
          <YStack
            flexShrink={1}
            onLayout={(event) => {
              setRenderedAttributeHeight(event.nativeEvent.layout.height)
              setRenderedAttributeY(event.nativeEvent.layout.y)
            }}
          >
            <Paragraph variant="sub" color="$grey-600" fontWeight="$medium" flexShrink={1} flexWrap="wrap">
              {horizontalAttribute}
            </Paragraph>
          </YStack>
          <XStack alignItems="center" gap="$2" justifyContent="flex-end" w="auto">
            {horizontalValue && (
              <YStack
                w="auto"
                alignSelf="flex-end"
                onLayout={(event) => {
                  setRenderedValueHeight(event.nativeEvent.layout.height)
                  setRenderedValueY(event.nativeEvent.layout.y)
                }}
              >
                <Paragraph color="$grey-900" fontWeight="$semiBold" textAlign="right">
                  {horizontalValue}
                </Paragraph>
              </YStack>
            )}
            {renderedImage}
          </XStack>
        </XStack>
      </YStack>
    )
  }

  return (
    <YStack
      py="$2"
      borderBottomWidth={isLastRow ? 0 : 2}
      borderBottomColor="$tableBorderColor"
      backgroundColor="$tableBackgroundColor"
      onPress={onPress}
      pressStyle={{
        opacity: onPress ? 0.8 : 1,
      }}
    >
      <XStack f={1} alignItems="center">
        {attributesArray.map((attr, index) => (
          <YStack
            key={`attribute-${attr}-${index}`}
            borderRightWidth={2}
            borderRightColor={index === attributesArray.length - 1 ? 'transparent' : '$white'}
            my="$-2"
            py="$2"
            px="$2.5"
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
