import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Portal } from 'tamagui'
import { Sheet as TamaguiSheet, type SheetProps as TamaguiSheetProps } from 'tamagui'
import { Stack } from '../base'

export interface FloatingSheetProps extends TamaguiSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function FloatingSheet({ children, isOpen, setIsOpen, ...props }: FloatingSheetProps) {
  const { bottom } = useSafeAreaInsets()
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
          stiffness: 160,
          damping: 10,
          mass: 0.22,
        }}
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
        <TamaguiSheet.Frame bg="transparent" px="$4" mb={bottom}>
          <Stack bg="$white" br="$8" overflow="hidden">
            {children}
          </Stack>
        </TamaguiSheet.Frame>
      </TamaguiSheet>
    </Portal>
  )
}
