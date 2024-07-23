import type { ForwardedRef } from 'react'

import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { forwardRef } from 'react'
import { StyleSheet } from 'react-native'

type Props = {
  snapPoints?: string[]
  children?: React.ReactNode
  onClose?: () => void
}

export { BottomSheetScrollView }

export const Sheet = forwardRef(
  ({ snapPoints = ['80%'], children, onClose }: Props, ref: ForwardedRef<BottomSheet>) => {
    return (
      <BottomSheet
        ref={ref}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            opacity={0.5}
            enableTouchThrough={false}
            pressBehavior="none"
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            onPress={onClose}
            style={[{ backgroundColor: 'rgba(0, 0, 0, 1)' }, StyleSheet.absoluteFillObject]}
          />
        )}
        index={-1}
        snapPoints={snapPoints}
      >
        {children}
      </BottomSheet>
    )
  }
)
