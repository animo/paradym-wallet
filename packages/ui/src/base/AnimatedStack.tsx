import Animated from 'react-native-reanimated'
import { Stack } from './Stacks'

// Its own module so that `Stacks` stays free of reanimated: the credential request UI's bundle
// renders with `Stack`/`XStack`/`YStack` but does not link reanimated, and a module-scope import
// here would be evaluated the moment it imports any of them.
export const AnimatedStack = Animated.createAnimatedComponent(Stack)
