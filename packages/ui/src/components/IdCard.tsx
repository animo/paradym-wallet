// FIXME: do not depend on app package in ui
import { useScaleAnimation } from '@package/app/src/hooks/useScaleAnimation'
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
  small?: boolean
}

const iconMapping = {
  locked: HeroIcons.LockClosed,
  loading: HeroIcons.ArrowPath,
  complete: HeroIcons.ShieldCheck,
  biometric: HeroIcons.FingerPrint,
} as const

export function IdCard({ icon, issuerImage, userName, onPress, hideUserName, small }: IdCardProps) {
  const rotation = useSharedValue(0)
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      justifyContent: 'center',
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

  const IconComponent = icon ? iconMapping[icon] : undefined
  return (
    <Animated.View style={pressStyle}>
      <YStack
        jc="space-between"
        height={small ? '$9' : '$15'}
        maxWidth={small ? '$14' : undefined}
        gap={small ? '$1' : '$6'}
        p={small ? '$3' : '$5'}
        borderRadius={small ? '$5' : '$8'}
        overflow="hidden"
        borderColor="#D8DAC8"
        bw={small ? '$0.25' : '$0.5'}
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
        <XStack justifyContent="space-between">
          <YStack gap={small ? '$1' : '$3'}>
            <Paragraph size={small ? '$1' : '$2'} fontWeight="$bold" color="$grey-700">
              PERSONALAUSWEIS
            </Paragraph>
            <Paragraph size={small ? '$3' : '$6'} fontWeight="$semiBold">
              {hideUserName ? '********' : userName ?? ''}
            </Paragraph>
          </YStack>
          <Stack>
            <Image src={issuerImage} width={small ? 12 : 24} height={small ? 24 : 48} resizeMode="contain" />
          </Stack>
        </XStack>
        <XStack justifyContent="space-between" flex-1>
          <XStack justifyContent="flex-start" alignItems="flex-end">
            {IconComponent ? (
              <Animated.View style={icon === 'loading' ? animatedStyle : undefined}>
                <Circle size={small ? '$1' : '$3'} backgroundColor="$grey-900" opacity={0.25}>
                  <IconComponent color="$white" size={small ? 12 : 24} />
                </Circle>
              </Animated.View>
            ) : (
              <Stack width={small ? '$1' : '$3'} height={small ? '$1' : '$3'} />
            )}
          </XStack>
          <XStack justifyContent="flex-end" alignItems="flex-end">
            {onPress && <HeroIcons.ArrowRight color="$black" />}
          </XStack>
        </XStack>
      </YStack>
    </Animated.View>
  )
}
