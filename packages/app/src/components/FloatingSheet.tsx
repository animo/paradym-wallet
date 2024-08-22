import { Stack } from '@package/ui/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Portal } from 'tamagui'
import { Sheet as TamaguiSheet, type SheetProps as TamaguiSheetProps } from 'tamagui'

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
          stiffness: 180,
          damping: 24,
          mass: 0.2,
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
        <TamaguiSheet.Frame elevation={1} gap="$6" br="$6" w="92%" p="$4" mx="auto">
          {children}
        </TamaguiSheet.Frame>
        <Stack h={bottom} />
      </TamaguiSheet>
    </Portal>
  )
}
