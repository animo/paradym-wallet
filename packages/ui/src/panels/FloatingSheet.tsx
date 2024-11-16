import { useEffect, useRef } from 'react'
import { AccessibilityInfo, findNodeHandle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Portal, Text, VisuallyHidden } from 'tamagui'
import { Sheet as TamaguiSheet, type SheetProps as TamaguiSheetProps } from 'tamagui'
import { Stack } from '../base'
export interface FloatingSheetProps extends TamaguiSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function FloatingSheet({ children, isOpen, setIsOpen, ...props }: FloatingSheetProps) {
  const { bottom } = useSafeAreaInsets()

  const sheetRef = useRef(null)

  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const handle = findNodeHandle(sheetRef.current)
      if (handle) {
        AccessibilityInfo.setAccessibilityFocus(handle)
      }
    }
  }, [isOpen])

  return (
    <Portal key="root">
      <TamaguiSheet
        dismissOnOverlayPress
        onOpenChange={setIsOpen}
        open={isOpen}
        snapPointsMode="fit"
        dismissOnSnapToBottom
        animationConfig={{
          type: 'spring',
          stiffness: 140,
          damping: 9,
          mass: 0.22,
        }}
        modal
        aria-modal={true}
        {...props}
      >
        <TamaguiSheet.Overlay
          style={{
            backgroundColor: '#00000033',
          }}
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <TamaguiSheet.Frame bg="transparent" px="$4" mb={bottom || '$4'}>
          <Stack bg="$white" br="$8" overflow="hidden">
            <VisuallyHidden ref={sheetRef}>
              <Text>Options opened</Text>
            </VisuallyHidden>
            {children}
          </Stack>
        </TamaguiSheet.Frame>
      </TamaguiSheet>
    </Portal>
  )
}
