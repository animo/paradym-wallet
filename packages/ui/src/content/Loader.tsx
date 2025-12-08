import { useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Circle, type StackProps } from 'tamagui'

interface LoaderProps extends StackProps {
  size?: 'small' | 'large'
  variant?: 'light' | 'dark'
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export function Loader({ size = 'small', variant = 'light' }: LoaderProps) {
  const rotation = useSharedValue(0)

  const circleSize = size === 'small' ? 21 : 48
  const borderWidth = size === 'small' ? 3.5 : 8

  const trackColor = variant === 'light' ? '$grey-300' : '#00000026'
  const spinnerColor = variant === 'light' ? '$primary-500' : 'white'

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 800,
        easing: Easing.linear,
      }),
      -1,
      false
    )
  }, [])

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }))

  return (
    <Circle size={circleSize} borderWidth={borderWidth} borderColor={trackColor}>
      <AnimatedCircle
        size={circleSize}
        borderWidth={borderWidth}
        borderColor={spinnerColor}
        style={[
          {
            position: 'absolute',
            borderLeftColor: '#00000001',
            borderBottomColor: '#00000001',
            borderRightColor: '#00000001',
            borderRadius: circleSize / 2, // This will round the edges
          },
          animatedStyles,
        ]}
      />
    </Circle>
  )
}
