import { type PropsWithChildren, useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

export interface FloatingSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onDismiss?: () => void

  /**
   * @default true
   */
  enableDismissOnClose?: boolean
}

const BACKDROP_DURATION = 200
const SHEET_DURATION = 250

export function FloatingSheet({
  children,
  isOpen,
  setIsOpen,
  onDismiss,
  enableDismissOnClose = true,
}: PropsWithChildren<FloatingSheetProps>) {
  const { bottom, left, right } = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(isOpen)

  const backdropOpacity = useSharedValue(0)
  const sheetTranslateY = useSharedValue(1)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION })
      sheetTranslateY.value = withTiming(0, { duration: SHEET_DURATION })
    } else if (isMounted) {
      backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION })
      sheetTranslateY.value = withTiming(1, { duration: SHEET_DURATION }, (finished) => {
        if (finished) {
          scheduleOnRN(setIsMounted, false)
          if (onDismiss) scheduleOnRN(onDismiss)
        }
      })
    }
  }, [isOpen])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: `${sheetTranslateY.value * 100}%` }],
  }))

  const handleBackdropPress = () => {
    if (enableDismissOnClose) setIsOpen(false)
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={() => setIsOpen(false)}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: left + 16,
            right: right + 16,
            bottom: bottom || 16,
            alignItems: 'center',
          },
          sheetStyle,
        ]}
      >
        <View
          style={{
            width: '100%',
            // Phone-sized in wide windows, such as the open iPhone Duo
            maxWidth: 440,
            backgroundColor: 'white',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </Animated.View>
    </Modal>
  )
}
