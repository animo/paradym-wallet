import { Button, HeroIcons } from '@package/ui'
import { useRouter } from 'expo-router'
import Animated from 'react-native-reanimated'
import { useScaleAnimation } from '../hooks/useScaleAnimation'

export function TextBackButton() {
  const router = useRouter()

  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation({ scaleInValue: 0.95 })

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
