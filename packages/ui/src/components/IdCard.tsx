import { useEffect } from 'react'
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
import { Circle } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'
import { Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons, Image } from '../content'

export interface IdCardProps {
  icon?: keyof typeof iconMapping
  issuerImage: number
  userName?: string
  hideUserName?: boolean
  onPress?: () => void
}

const iconMapping = {
  locked: <HeroIcons.LockClosed color="$white" />,
  loading: <HeroIcons.ArrowPath color="$white" />,
  complete: <HeroIcons.ShieldCheck color="$white" />,
  biometric: <HeroIcons.FingerPrint color="$white" />,
} as const

export function IdCard({ icon, issuerImage, userName, onPress, hideUserName }: IdCardProps) {
  const rotation = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  useEffect(() => {
    if (icon === 'loading') {
      rotation.value = withSequence(
        withTiming(360, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 0 }),
        withRepeat(
          withSequence(
            withDelay(500, withTiming(360, { duration: 1500, easing: Easing.inOut(Easing.ease) })),
            withTiming(0, { duration: 0 })
          ),
          -1
        )
      )
    } else {
      rotation.value = 0
    }
  }, [icon, rotation])

  return (
    <YStack
      jc="space-between"
      h="$15"
      gap="$6"
      p="$5"
      borderRadius="$8"
      overflow="hidden"
      borderColor="#D8DAC8"
      bw="$0.5"
      onPress={onPress}
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
      <XStack justifyContent="space-between">
        <YStack gap="$3">
          <Paragraph size="$2" fontWeight="$bold" color="$grey-700">
            PERSONALAUSWEIS
          </Paragraph>
          <Paragraph size="$6" fontWeight="$semiBold">
            {hideUserName ? '********' : userName ?? ''}
          </Paragraph>
        </YStack>
        <Stack>
          <Image src={issuerImage} width={48} height={48} resizeMode="contain" />
        </Stack>
      </XStack>
      <XStack justifyContent="flex-start">
        {icon ? (
          <Animated.View style={icon === 'loading' ? animatedStyle : undefined}>
            <Circle size="$3" p="$2" backgroundColor="$grey-900" opacity={0.25}>
              {iconMapping[icon]}
            </Circle>
          </Animated.View>
        ) : (
          <Stack width="$3" height="$3" />
        )}
      </XStack>
    </YStack>
  )
}
