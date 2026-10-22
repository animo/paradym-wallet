import { createAnimations } from '@tamagui/animations-react-native'

// Force the native driver: Tamagui's own Fabric check reads `global.__nativeFabricUIManager`, which RN never sets,
// so it falls back to the JS driver. That calls `setNativeProps` from the JS thread every frame, which on RN < 0.86.1
// races with main-thread commits (e.g. react-native-screens during a modal presentation) and crashes in
// `ShadowNode::clone`. Only animate props on RN's native driver allowlist (opacity, transforms, colors, ...).
export const animations = createAnimations(
  {
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
  },
  { useNativeDriver: true }
)

export const springConfig = {
  damping: 24,
  mass: 0.8,
  stiffness: 200,
  restSpeedThreshold: 0.05,
}

// Reanimated keeps these modifiers on a base class it doesn't export, shared by entering/exiting animations and
// layout transitions.
type SpringAnimationBuilder<T> = {
  springify(): T
  damping(damping: number): T
  mass(mass: number): T
  stiffness(stiffness: number): T
  restSpeedThreshold(restSpeedThreshold: number): T
  delay(delay: number): T
}

export const useSpringify = <T extends SpringAnimationBuilder<T>>(AnimationClass: new () => T, delay = 0): T => {
  const animation = new AnimationClass()
  return animation
    .springify()
    .damping(springConfig.damping)
    .mass(springConfig.mass)
    .stiffness(springConfig.stiffness)
    .restSpeedThreshold(springConfig.restSpeedThreshold)
    .delay(delay) as T
}
