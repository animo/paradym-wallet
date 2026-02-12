import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  Extrapolation,
  type SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Path, Stop, type SvgProps } from 'react-native-svg'

const COLOR_SCHEMES = [
  { top: '#DFDDD9', bottom: '#6F60DF' }, // warm grey → purple
  { top: '#D9DFE5', bottom: '#6098DF' }, // cool grey → blue
  { top: '#D9E5DF', bottom: '#45C9A8' }, // sage → teal
  { top: '#E5DDD9', bottom: '#DF8F60' }, // warm → amber
  { top: '#DFD9E5', bottom: '#C060DF' }, // lavender → magenta
  { top: '#DFDDD9', bottom: '#6F60DF' }, // back to start (seamless loop)
]

const DURATION_PER_SCHEME = 4000

const PATHS = {
  bottomLeft:
    'M49.012 181.762C49.012 184.551 46.751 186.811 43.963 186.811H5.401C2.613 186.811 0.35199 184.551 0.35199 181.762V143.2C0.35199 140.412 2.613 138.151 5.401 138.151H43.963C46.751 138.151 49.012 140.412 49.012 143.2V181.762Z',
  topRight:
    'M186.458 43.611C186.458 46.3995 184.197 48.66 181.409 48.66H142.846C140.058 48.66 137.798 46.3995 137.798 43.611V5.04895C137.798 2.26049 140.058 0 142.846 0H181.409C184.197 0 186.458 2.26049 186.458 5.04895V43.611Z',
  steppedDiagonal:
    'M143.199 186.456C140.411 186.456 138.15 184.195 138.15 181.407V144.979C138.15 142.19 135.89 139.93 133.101 139.93H96.133C93.345 139.93 91.084 137.669 91.084 134.881V99.0559C91.084 96.2674 88.824 94.0069 86.035 94.0069H49.696C46.908 94.0069 44.647 91.7464 44.647 88.958V54.059C44.647 51.2705 42.387 49.01 39.598 49.01H5.04901C2.26001 49.01 0 46.7495 0 43.9611V5.39902C0 2.61056 2.26001 0.350067 5.04901 0.350067L43.611 0.350068C46.399 0.350069 48.66 2.61056 48.66 5.39902V40.298C48.66 43.0865 50.92 45.3469 53.709 45.3469H88.258C91.047 45.3469 93.307 47.6074 93.307 50.3959V86.221C93.307 89.0095 95.568 91.27 98.356 91.27H134.695C137.484 91.27 139.744 93.5304 139.744 96.3189V132.747C139.744 135.535 142.005 137.796 144.793 137.796H181.761C184.55 137.796 186.81 140.056 186.81 142.845V181.407C186.81 184.195 184.55 186.456 181.761 186.456H143.199Z',
}

function BlobLayer({
  index,
  scheme,
  progress,
}: {
  index: number
  scheme: { top: string; bottom: string }
  progress: SharedValue<number>
}) {
  const gradId = `grad_${index}`

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 187 187" fill="none">
        <Path d={PATHS.bottomLeft} fill={`url(#${gradId})`} />
        <Path d={PATHS.topRight} fill={`url(#${gradId})`} />
        <Path d={PATHS.steppedDiagonal} fill={`url(#${gradId})`} />
        <Defs>
          <LinearGradient id={gradId} x1="93.405" y1="0" x2="93.405" y2="186.811" gradientUnits="userSpaceOnUse">
            <Stop offset="0.471775" stopColor={scheme.top} />
            <Stop offset="1" stopColor={scheme.bottom} />
          </LinearGradient>
        </Defs>
      </Svg>
    </Animated.View>
  )
}

const ROTATION_DURATION = 30000
const BREATHE_DURATION = 6000
const DRIFT_X_DURATION = 8000
const DRIFT_Y_DURATION = 10000
const DRIFT_RANGE = 12

export function Blob(props: SvgProps) {
  const progress = useSharedValue(0)
  const rotation = useSharedValue(0)
  const breathe = useSharedValue(0)
  const driftX = useSharedValue(0)
  const driftY = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(COLOR_SCHEMES.length - 1, {
        duration: (COLOR_SCHEMES.length - 1) * DURATION_PER_SCHEME,
        easing: Easing.linear,
      }),
      -1,
      false
    )

    rotation.value = withRepeat(
      withTiming(360, {
        duration: ROTATION_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    )

    breathe.value = withRepeat(
      withTiming(1, {
        duration: BREATHE_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )

    driftX.value = withRepeat(
      withTiming(1, {
        duration: DRIFT_X_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )

    driftY.value = withRepeat(
      withTiming(1, {
        duration: DRIFT_Y_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
  }, [])

  const transformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(driftX.value, [0, 1], [-DRIFT_RANGE, DRIFT_RANGE]) },
      { translateY: interpolate(driftY.value, [0, 1], [-DRIFT_RANGE * 0.7, DRIFT_RANGE * 0.7]) },
      { rotate: `${rotation.value}deg` },
      { scale: interpolate(breathe.value, [0, 1], [1, 1.06]) },
    ],
  }))

  return (
    <Animated.View style={[{ width: '100%', aspectRatio: 1 }, transformStyle]} {...props}>
      {COLOR_SCHEMES.map((scheme, i) => (
        <BlobLayer key={i} index={i} scheme={scheme} progress={progress} />
      ))}
    </Animated.View>
  )
}
