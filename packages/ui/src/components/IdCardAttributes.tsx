import { capitalizeFirstLetter } from '@package/utils'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
  useAnimatedStyle,
  withDelay,
} from 'react-native-reanimated'
import { LinearGradient } from 'tamagui/linear-gradient'
import { Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons, Image } from '../content'

export interface IdCardAttributesProps {
  issuerImage: number
  onPress?: () => void
  attributes: string[]
}

export function IdCardAttributes({ issuerImage, onPress, attributes }: IdCardAttributesProps) {
  const groupedAttributes = useMemo(() => {
    const result: Array<[string, string | undefined]> = []
    for (let i = 0; i < attributes.length; i += 2) {
      result.push([attributes[i], attributes[i + 1]])
    }
    return result
  }, [attributes])

  const scale = useSharedValue(1)

  const pressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 50 })
  }

  return (
    <Animated.View style={pressStyle}>
      <YStack
        minHeight="$13"
        borderRadius="$8"
        overflow="hidden"
        borderColor="#D8DAC8"
        bw="$0.5"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={['#EFE7DA', '#EDEEE6', '#E9EDEE', '#D4D6C0']}
          start={[0.98, 0.02]}
          end={[0.28, 1.0]}
          locations={[0.0207, 0.3341, 0.5887, 1.0]}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.2)']}
          start={[0, 0]}
          end={[1, 0]}
          style={StyleSheet.absoluteFillObject}
        />
        <XStack
          px="$4.5"
          justifyContent="space-between"
          alignItems="center"
          borderBottomColor="#D8DAC8"
          borderBottomWidth="$0.5"
        >
          <Paragraph size="$1" py="$4.5" fontWeight="$bold" color="$grey-700">
            PERSONALAUSWEIS
          </Paragraph>
          <Stack>
            <Image src={issuerImage} width={32} height={32} resizeMode="contain" />
          </Stack>
        </XStack>
        <XStack p="$4" gap="$4" backgroundColor="$white" flex-1 opacity={0.8}>
          <YStack gap="$2.5" fg={1}>
            {groupedAttributes.map(([first, second]) => (
              <XStack key={first + second} gap="$4">
                <Stack flexGrow={1} flexBasis={0}>
                  <Paragraph variant="sub" color="#415963">
                    {capitalizeFirstLetter(first)}
                  </Paragraph>
                </Stack>
                <Stack flexGrow={1} flexBasis={0}>
                  <Paragraph variant="sub" color="#415963">
                    {second ? capitalizeFirstLetter(second) : ''}
                  </Paragraph>
                </Stack>
              </XStack>
            ))}
          </YStack>
          <YStack justifyContent="flex-end">{onPress && <HeroIcons.ArrowRight color="$black" />}</YStack>
        </XStack>
      </YStack>
    </Animated.View>
  )
}
