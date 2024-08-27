import { createAnimations } from '@tamagui/animations-react-native'

export const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  normal: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
    delay: 2,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
})
