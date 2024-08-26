import { Button, HeroIcons } from '@package/ui'
import { useRouter } from 'expo-router'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

export function TextBackButton() {
  const router = useRouter()

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
      <Button.Text
        color="$primary-500"
        fontWeight="$semiBold"
        onPress={() => router.back()}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <HeroIcons.ArrowLeft mr={-4} color="$primary-500" size={20} /> Back
      </Button.Text>
    </Animated.View>
  )
}
