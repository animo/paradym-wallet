import type { ForwardedRef } from 'react'

import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { forwardRef } from 'react'

type Props = {
  snapPoints?: string[]
  children?: React.ReactNode
}

export { BottomSheetScrollView }
export const Sheet = forwardRef(
  ({ snapPoints = ['80%'], children }: Props, ref: ForwardedRef<BottomSheet>) => {
    return (
      <BottomSheet ref={ref} index={-1} snapPoints={snapPoints}>
        {children}
      </BottomSheet>
    )
  }
)
