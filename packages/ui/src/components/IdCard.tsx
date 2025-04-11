import { useEffect } from 'react'
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
import { AnimatedStack, Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons, Image } from '../content'
import { useScaleAnimation } from '../hooks'

export interface IdCardProps {
  icon?: keyof typeof iconMapping
  userName?: string
  hideUserName?: boolean
  onPress?: () => void
}

const iconMapping = {
  locked: HeroIcons.LockClosed,
  loading: HeroIcons.ArrowPath,
  complete: HeroIcons.ShieldCheck,
  biometric: HeroIcons.FingerPrint,
} as const

export function IdCard({ icon, userName, onPress, hideUserName }: IdCardProps) {
  const rotation = useSharedValue(0)
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  useEffect(() => {
    if (icon === 'loading') {
      rotation.value = withSequence(
        withTiming(360, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 0 }),
        withRepeat(
          withSequence(
            withDelay(500, withTiming(360, { duration: 800, easing: Easing.inOut(Easing.ease) })),
            withTiming(0, { duration: 0 })
          ),
          -1
        )
      )
    } else {
      rotation.value = 0
    }
  }, [icon, rotation])

  const IconComponent = icon ? iconMapping[icon] : undefined

  return (
    <Animated.View style={pressStyle}>
      <YStack
        jc="space-between"
        w="100%"
        h="$15"
        gap="$6"
        p="$5"
        borderRadius="$8"
        overflow="hidden"
        borderColor="#D8DAC8"
        bw="$0.5"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        position="relative"
      >
        <XStack justifyContent="space-between">
          <YStack gap="$3">
            <Paragraph size="$2" fontWeight="$bold" color="$grey-700">
              PERSONALAUSWEIS
            </Paragraph>
            <Paragraph color="$grey-900" size="$6" fontWeight="$semiBold">
              {hideUserName && !icon ? '********' : userName ?? ''}
            </Paragraph>
          </YStack>
          <Stack>
            <Image src="german-issuer-image" width={36} height={42} contentFit="contain" />
          </Stack>
        </XStack>
        <XStack justifyContent="space-between" flex-1>
          <XStack justifyContent="flex-start" alignItems="flex-end">
            {IconComponent && (
              <AnimatedStack style={animatedStyle}>
                <Circle m="$-1" size="$3.5" backgroundColor="#282C3740">
                  <IconComponent strokeWidth={2} color="$white" size={22} />
                </Circle>
              </AnimatedStack>
            )}
          </XStack>
          <XStack justifyContent="flex-end" alignItems="flex-end">
            {onPress && <HeroIcons.ArrowRight color="$black" />}
          </XStack>
        </XStack>
        <Stack zIndex="$-1" position="absolute" bg="$idCardBackground" top={0} left={0} right={0} bottom={0}>
          <Image src="pid_background" width="100%" contentFit="cover" height="100%" />
        </Stack>
      </YStack>
    </Animated.View>
  )
}
