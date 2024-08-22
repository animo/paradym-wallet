import { useEffect } from 'react'
import { Path, Svg } from 'react-native-svg'

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { YStack } from '../base'

const RippleCircle = () => {
  const scale = useSharedValue(0.5)
  const opacity = useSharedValue(1)

  useEffect(() => {
    scale.value = withDelay(
      1,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 2500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      )
    )

    opacity.value = withDelay(
      1,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      )
    )
  }, [opacity, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        {
          width: 184,
          height: 184,
          borderRadius: 96,
          backgroundColor: '#dbe9fe',
          position: 'absolute',
        },
        animatedStyle,
      ]}
    />
  )
}

export const AnimatedFingerPrintCircle = () => {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <RippleCircle />
      <YStack br={999} bg="$primary-50" p="$6">
        <Svg style={{ zIndex: 5 }} width="64" height="64" viewBox="56 61 46 52" fill="none">
          <Path
            d="M64.4604 80.6049C64.2452 80.4327 64.1272 80.239 64.1065 80.0237C64.0841 79.8084 64.1375 79.5716 64.2667 79.3133C66.9792 75.7397 70.316 72.9299 74.2771 70.8839C78.2382 68.8396 82.4577 67.8174 86.9354 67.8174C91.4993 67.8174 95.7937 68.7965 99.8185 70.7547C103.845 72.7146 107.193 75.5244 109.863 79.1841C110.121 79.4855 110.197 79.7542 110.09 79.9901C109.981 80.2278 109.819 80.4327 109.604 80.6049C109.389 80.7341 109.152 80.7987 108.894 80.7987C108.635 80.7987 108.399 80.648 108.183 80.3466C105.772 76.9022 102.683 74.2861 98.9169 72.4984C95.1487 70.7125 91.1549 69.8195 86.9354 69.8195C82.7591 69.8195 78.8307 70.734 75.1503 72.563C71.4682 74.3938 68.4 76.9883 65.9459 80.3466C65.7306 80.648 65.4826 80.8099 65.2019 80.8323C64.9229 80.8529 64.6757 80.7772 64.4604 80.6049ZM94.2979 112.509C89.9493 111.39 86.3757 109.183 83.5771 105.888C80.7785 102.595 79.3792 98.5806 79.3792 93.8445C79.3792 91.7779 80.1327 90.0445 81.6396 88.6443C83.1465 87.2458 84.9549 86.5466 87.0646 86.5466C89.1743 86.5466 90.9723 87.2458 92.4586 88.6443C93.9432 90.0445 94.6854 91.7779 94.6854 93.8445C94.6854 95.3515 95.2452 96.6216 96.3646 97.6549C97.484 98.6883 98.8188 99.205 100.369 99.205C101.919 99.205 103.242 98.6883 104.339 97.6549C105.438 96.6216 105.988 95.3515 105.988 93.8445C105.988 88.764 104.115 84.4911 100.369 81.026C96.6229 77.5592 92.1667 75.8258 87 75.8258C81.7903 75.8258 77.334 77.5695 73.6313 81.057C69.9285 84.5445 68.0771 88.807 68.0771 93.8445C68.0771 94.8779 68.1951 96.1807 68.431 97.7531C68.6687 99.3238 69.1535 101.142 69.8854 103.209C69.9716 103.511 69.9612 103.769 69.8544 103.984C69.7459 104.199 69.5625 104.372 69.3042 104.501C69.0028 104.63 68.7341 104.641 68.4982 104.534C68.2605 104.426 68.0986 104.221 68.0125 103.92C67.3236 102.154 66.8285 100.454 66.5271 98.8175C66.2257 97.1813 66.075 95.5237 66.075 93.8445C66.075 88.2043 68.1314 83.4681 72.244 79.6362C76.355 75.8043 81.2521 73.8883 86.9354 73.8883C92.7049 73.8883 97.6563 75.8043 101.79 79.6362C105.923 83.4681 107.99 88.2043 107.99 93.8445C107.99 95.9112 107.247 97.6446 105.763 99.0448C104.276 100.443 102.478 101.142 100.369 101.142C98.3021 101.142 96.505 100.443 94.9774 99.0448C93.448 97.6446 92.6834 95.9112 92.6834 93.8445C92.6834 92.3376 92.134 91.0674 91.0352 90.0341C89.9381 89.0008 88.6146 88.4841 87.0646 88.4841C85.5146 88.4841 84.1799 89.0008 83.0604 90.0341C81.941 91.0674 81.3813 92.3376 81.3813 93.8445C81.3813 98.107 82.6514 101.67 85.1917 104.534C87.732 107.397 90.9611 109.388 94.8792 110.507C95.1806 110.636 95.3855 110.808 95.494 111.024C95.6008 111.239 95.6111 111.476 95.525 111.734C95.4389 111.992 95.2985 112.208 95.1039 112.38C94.911 112.552 94.6424 112.595 94.2979 112.509ZM72.4688 67.1716C72.2535 67.3008 72.0167 67.3223 71.7584 67.2362C71.5 67.1501 71.3278 66.9994 71.2417 66.7841C71.1125 66.5258 71.0695 66.2778 71.1125 66.0401C71.1556 65.8042 71.3063 65.6216 71.5646 65.4924C73.9327 64.1577 76.4299 63.1563 79.0563 62.488C81.6827 61.8215 84.3521 61.4883 87.0646 61.4883C89.7771 61.4883 92.425 61.8215 95.0084 62.488C97.5917 63.1563 100.089 64.1147 102.5 65.3633C102.844 65.5355 103.049 65.7508 103.115 66.0091C103.179 66.2674 103.146 66.5043 103.017 66.7195C102.931 66.9779 102.758 67.1604 102.5 67.2672C102.242 67.3757 101.983 67.3438 101.725 67.1716C99.4861 65.923 97.1293 64.9973 94.6544 64.3945C92.1779 63.7918 89.6479 63.4904 87.0646 63.4904C84.4813 63.4904 81.9737 63.8133 79.5419 64.4591C77.1084 65.1049 74.7507 66.0091 72.4688 67.1716ZM80.5417 111.734C78.1306 109.108 76.2361 106.395 74.8584 103.597C73.4806 100.798 72.7917 97.5473 72.7917 93.8445C72.7917 90.0126 74.191 86.7834 76.9896 84.157C79.7882 81.5306 83.1465 80.2174 87.0646 80.2174C90.9827 80.2174 94.3522 81.5306 97.1732 84.157C99.9925 86.7834 101.402 90.0126 101.402 93.8445C101.402 94.1459 101.305 94.3827 101.11 94.555C100.917 94.7272 100.67 94.8133 100.369 94.8133C100.153 94.8133 99.9382 94.7272 99.7229 94.555C99.5077 94.3827 99.4 94.1459 99.4 93.8445C99.4 90.5293 98.1841 87.7522 95.7524 85.5133C93.3189 83.2744 90.4229 82.1549 87.0646 82.1549C83.7063 82.1549 80.8215 83.2744 78.4104 85.5133C75.9993 87.7522 74.7938 90.5293 74.7938 93.8445C74.7938 97.4181 75.4077 100.422 76.6357 102.855C77.8619 105.287 79.6375 107.773 81.9625 110.313C82.2209 110.572 82.3285 110.83 82.2854 111.088C82.2424 111.347 82.1347 111.562 81.9625 111.734C81.7903 111.906 81.575 112.004 81.3167 112.026C81.0584 112.047 80.8 111.949 80.5417 111.734ZM99.8521 107.213C96.1493 107.213 92.9098 105.943 90.1336 103.403C87.3557 100.863 85.9667 97.6765 85.9667 93.8445C85.9667 93.5862 86.0528 93.3597 86.225 93.1651C86.3972 92.9722 86.634 92.8758 86.9354 92.8758C87.2368 92.8758 87.484 92.9722 87.6769 93.1651C87.8715 93.3597 87.9688 93.5862 87.9688 93.8445C87.9688 97.1598 89.1528 99.8826 91.5209 102.013C93.8889 104.145 96.666 105.211 99.8521 105.211C100.283 105.211 100.735 105.19 101.208 105.147C101.682 105.104 102.156 105.039 102.629 104.953C102.888 104.91 103.113 104.953 103.306 105.082C103.501 105.211 103.641 105.426 103.727 105.728C103.813 105.986 103.76 106.212 103.567 106.405C103.372 106.599 103.146 106.74 102.888 106.826C102.414 106.955 101.897 107.052 101.338 107.118C100.778 107.181 100.283 107.213 99.8521 107.213Z"
            fill="#276FF4"
          />
        </Svg>
      </YStack>
    </YStack>
  )
}
