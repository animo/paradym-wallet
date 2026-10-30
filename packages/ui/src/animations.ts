import { createAnimations } from '@tamagui/animations-react-native'

// Force the native driver: Tamagui's own Fabric check reads `global.__nativeFabricUIManager`, which RN never sets,
// so it falls back to the JS driver. That calls `setNativeProps` from the JS thread every frame, which on RN < 0.86.1
// races with main-thread commits (e.g. react-native-screens during a modal presentation) and crashes in
// `ShadowNode::clone`. Only animate props on RN's native driver allowlist (opacity, transforms, colors, ...).
const driver = createAnimations(
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

// Tamagui also animates border widths by default, which aren't on RN's native driver allowlist: every animated
// component with a border width logged "Style property 'borderWidth' is not supported by native animated module".
// A preset name (`transition="quick"`) animates only the keys the native driver supports, the rest is applied
// directly. Components that pass a transition object choose their keys themselves.
// Style updates without a re-render (press and other states) don't check the transition's keys, so those only get the
// native driver keys. A state that changes another key, like `bw="1 press:2"`, won't apply.
const nativeDriverStyleKeys = new Set([
  'transform',
  'opacity',
  'backgroundColor',
  'color',
  'borderColor',
  'borderLeftColor',
  'borderRightColor',
  'borderTopColor',
  'borderBottomColor',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
])

const nativeDriverTransitions = new Map<string, Record<string, string>>()
const toNativeDriverTransition = (preset: string) => {
  let transition = nativeDriverTransitions.get(preset)
  if (!transition) {
    transition = Object.fromEntries(Array.from(nativeDriverStyleKeys, (key) => [key, preset]))
    nativeDriverTransitions.set(preset, transition)
  }
  return transition
}

export const animations: typeof driver = {
  ...driver,
  useAnimations: (animationProps) => {
    const transition = animationProps.styleState?.effectiveTransition ?? animationProps.props.transition
    if (typeof transition !== 'string' || !(transition in driver.animations))
      return driver.useAnimations(animationProps)

    const nativeDriverTransition = toNativeDriverTransition(transition)
    const { useStyleEmitter } = animationProps
    return driver.useAnimations({
      ...animationProps,
      props: { ...animationProps.props, transition: nativeDriverTransition },
      styleState: animationProps.styleState && {
        ...animationProps.styleState,
        effectiveTransition: nativeDriverTransition,
      },
      useStyleEmitter:
        useStyleEmitter &&
        ((listener) =>
          useStyleEmitter((nextStyle, ...rest) => {
            const nativeDriverStyle: typeof nextStyle = {}
            for (const key in nextStyle) {
              if (nativeDriverStyleKeys.has(key)) nativeDriverStyle[key] = nextStyle[key]
            }
            listener(nativeDriverStyle, ...rest)
          })),
    })
  },
}

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
