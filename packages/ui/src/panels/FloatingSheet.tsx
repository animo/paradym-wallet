import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { type PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Stack } from '../base'

export interface FloatingSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onDismiss?: () => void

  /**
   * @default true
   */
  enableDismissOnClose?: boolean

  /**
   * @default true
   */
  enablePanDownToClose?: boolean
}

export function FloatingSheet({
  children,
  isOpen,
  setIsOpen,
  onDismiss,
  enableDismissOnClose = true,
  enablePanDownToClose = true,
}: PropsWithChildren<FloatingSheetProps>) {
  // refs
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const { bottom } = useSafeAreaInsets()

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.2} />
    ),
    []
  )

  useEffect(() => {
    if (isOpen) bottomSheetRef.current?.present()
    else bottomSheetRef.current?.dismiss()
  }, [isOpen])

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose={enablePanDownToClose}
      enableDismissOnClose={enableDismissOnClose}
      enableDynamicSizing
      onDismiss={onDismiss}
      onChange={(index) => setIsOpen(index !== -1)}
      handleComponent={null}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'transparent' }}
    >
      <BottomSheetView style={{ backgroundColor: 'transparent' }}>
        <Stack bg="white" borderRadius="$10" overflow="hidden" mx="$4" mb={bottom || '$4'}>
          {children}
        </Stack>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
