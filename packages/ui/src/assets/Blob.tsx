import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  Extrapolation,
  type SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
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

function BlobPathSvg({
  gradId,
  scheme,
  pathKey,
}: {
  gradId: string
  scheme: { top: string; bottom: string }
  pathKey: keyof typeof PATHS
}) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 187 187" fill="none">
      <Defs>
        <LinearGradient id={gradId} x1="93.405" y1="0" x2="93.405" y2="186.811" gradientUnits="userSpaceOnUse">
          <Stop offset="0.471775" stopColor={scheme.top} />
          <Stop offset="1" stopColor={scheme.bottom} />
        </LinearGradient>
      </Defs>
      <Path d={PATHS[pathKey]} fill={`url(#${gradId})`} />
    </Svg>
  )
}

function BlobLayer({
  index,
  scheme,
  progress,
  entranceDiag,
  entranceBL,
  entranceTR,
}: {
  index: number
  scheme: { top: string; bottom: string }
  progress: SharedValue<number>
  entranceDiag: SharedValue<number>
  entranceBL: SharedValue<number>
  entranceTR: SharedValue<number>
}) {
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
  }))

  const diagStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(entranceDiag.value, [0, 1], [0.3, 1]) }],
    opacity: entranceDiag.value,
  }))

  const blStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(entranceBL.value, [0, 1], [-100, 0]) },
      { translateY: interpolate(entranceBL.value, [0, 1], [100, 0]) },
    ],
    opacity: entranceBL.value,
  }))

  const trStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(entranceTR.value, [0, 1], [100, 0]) },
      { translateY: interpolate(entranceTR.value, [0, 1], [-100, 0]) },
    ],
    opacity: entranceTR.value,
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, diagStyle]}>
        <BlobPathSvg gradId={`g${index}d`} scheme={scheme} pathKey="steppedDiagonal" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, blStyle]}>
        <BlobPathSvg gradId={`g${index}bl`} scheme={scheme} pathKey="bottomLeft" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, trStyle]}>
        <BlobPathSvg gradId={`g${index}tr`} scheme={scheme} pathKey="topRight" />
      </Animated.View>
    </Animated.View>
  )
}

function GlowBlobLayer({
  index,
  scheme,
  progress,
}: {
  index: number
  scheme: { top: string; bottom: string }
  progress: SharedValue<number>
}) {
  const gradId = `glow_${index}`

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 187 187" fill="none">
        <Defs>
          <LinearGradient id={gradId} x1="93.405" y1="0" x2="93.405" y2="186.811" gradientUnits="userSpaceOnUse">
            <Stop offset="0.471775" stopColor={scheme.top} />
            <Stop offset="1" stopColor={scheme.bottom} />
          </LinearGradient>
        </Defs>
        <Path d={PATHS.bottomLeft} fill={`url(#${gradId})`} />
        <Path d={PATHS.topRight} fill={`url(#${gradId})`} />
        <Path d={PATHS.steppedDiagonal} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  )
}

function ShimmerOverlay({ shimmer }: { shimmer: SharedValue<number> }) {
  const bandStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-150, 350]) },
      { rotate: '25deg' },
    ],
    opacity: interpolate(shimmer.value, [0, 0.1, 0.5, 0.9, 1], [0, 0.5, 0.5, 0.5, 0]),
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -100,
            width: 50,
            height: 500,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 25,
          },
          bandStyle,
        ]}
      />
    </Animated.View>
  )
}

const ROTATION_DURATION = 30000
const BREATHE_DURATION = 6000
const DRIFT_X_DURATION = 8000
const DRIFT_Y_DURATION = 10000
const DRIFT_RANGE = 12
const SHIMMER_SWEEP = 1500
const SHIMMER_PAUSE = 8000
const GLOW_PULSE_DURATION = 5000
const ENTRANCE_SPRING = { damping: 14, stiffness: 90, mass: 0.8 }

export function Blob(props: SvgProps) {
  const progress = useSharedValue(0)
  const rotation = useSharedValue(0)
  const breathe = useSharedValue(0)
  const driftX = useSharedValue(0)
  const driftY = useSharedValue(0)
  const entranceDiag = useSharedValue(0)
  const entranceBL = useSharedValue(0)
  const entranceTR = useSharedValue(0)
  const shimmer = useSharedValue(0)
  const glowPulse = useSharedValue(0)

  useEffect(() => {
    // Entrance: staggered spring — diagonal first, then corners
    entranceDiag.value = withSpring(1, ENTRANCE_SPRING)
    entranceBL.value = withDelay(200, withSpring(1, ENTRANCE_SPRING))
    entranceTR.value = withDelay(400, withSpring(1, ENTRANCE_SPRING))

    // Color cycling (starts after entrance settles)
    progress.value = withDelay(
      600,
      withRepeat(
        withTiming(COLOR_SCHEMES.length - 1, {
          duration: (COLOR_SCHEMES.length - 1) * DURATION_PER_SCHEME,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    )

    rotation.value = withRepeat(
      withTiming(360, { duration: ROTATION_DURATION, easing: Easing.linear }),
      -1,
      false
    )

    breathe.value = withRepeat(
      withTiming(1, { duration: BREATHE_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    driftX.value = withRepeat(
      withTiming(1, { duration: DRIFT_X_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    driftY.value = withRepeat(
      withTiming(1, { duration: DRIFT_Y_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    // Glow ring pulse
    glowPulse.value = withRepeat(
      withTiming(1, { duration: GLOW_PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    // Shimmer: sweep once then pause, repeat
    shimmer.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: SHIMMER_SWEEP, easing: Easing.inOut(Easing.ease) }),
          withDelay(SHIMMER_PAUSE, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      )
    )
  }, [])

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1.12, 1.20]) }],
    opacity: interpolate(glowPulse.value, [0, 1], [0.15, 0.3]),
  }))

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
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
        {COLOR_SCHEMES.map((scheme, i) => (
          <GlowBlobLayer key={i} index={i} scheme={scheme} progress={progress} />
        ))}
      </Animated.View>
      {COLOR_SCHEMES.map((scheme, i) => (
        <BlobLayer
          key={i}
          index={i}
          scheme={scheme}
          progress={progress}
          entranceDiag={entranceDiag}
          entranceBL={entranceBL}
          entranceTR={entranceTR}
        />
      ))}
      <ShimmerOverlay shimmer={shimmer} />
    </Animated.View>
  )
}
