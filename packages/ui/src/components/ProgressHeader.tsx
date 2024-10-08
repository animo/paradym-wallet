import { type ComponentProps, useEffect } from 'react'
import {
  Easing,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { AnimatedStack, Stack, XStack, YStack } from '../base'
import { HeroIcons, IconContainer } from '../content'

interface ProgressHeaderProps extends ComponentProps<typeof YStack> {
  variant?: 'full' | 'small'
  color?: 'primary' | 'danger'
  progress: number
  onBack?: () => void
  onCancel?: () => void
}

export function ProgressHeader({
  variant = 'full',
  progress,
  onBack,
  onCancel,
  color = 'primary',
  ...props
}: ProgressHeaderProps) {
  const isError = color === 'danger'

  const colorValue = useSharedValue(color === 'primary' ? 0 : 1)
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(colorValue.value, [0, 1], ['#4365DE', '#DC3130'])
    return { backgroundColor: backgroundColor }
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only change when color changes
  useEffect(() => {
    colorValue.value = withTiming(color === 'primary' ? 0 : 1, { duration: 1000 })
  }, [color])

  return (
    <YStack gap="$4" {...props}>
      <XStack jc="space-between">
        {onBack ? <IconContainer icon={<HeroIcons.ArrowLeft />} onPress={onBack} /> : <Stack />}
        {onCancel ? <IconContainer icon={<HeroIcons.X />} onPress={onCancel} /> : <Stack />}
      </XStack>
      <Stack mb="$4" mx={variant === 'small' ? '$-4' : '$0'}>
        {variant === 'small' ? (
          <Stack pos="absolute" h={1} w="100%" bg="$grey-200" />
        ) : (
          <Stack pos="absolute" h={12} w="100%" br={24} bg="$grey-200" />
        )}
        <AnimatedStack
          layout={
            isError
              ? LinearTransition.duration(1000).easing(Easing.out(Easing.ease))
              : LinearTransition.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05)
          }
          h={variant === 'small' ? 4 : 12}
          w={`${progress}%`}
          style={animatedStyle}
          borderTopLeftRadius={variant === 'small' ? 0 : 24}
          borderBottomLeftRadius={variant === 'small' ? 0 : 24}
          borderTopRightRadius={variant === 'small' ? (progress === 100 ? 0 : 2) : 24}
          borderBottomRightRadius={variant === 'small' ? (progress === 100 ? 0 : 2) : 24}
        />
      </Stack>
    </YStack>
  )
}
