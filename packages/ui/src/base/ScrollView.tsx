import { forwardRef } from 'react'
import type { ScrollViewProps as TScrollViewProps } from 'tamagui'
import { Spacer, ScrollView as TScrollView } from 'tamagui'

interface ScrollViewProps extends TScrollViewProps {
  safeAreaBottom?: number
  safeAreaTop?: number
}

export const ScrollView = forwardRef<TScrollView, ScrollViewProps>(
  ({ safeAreaBottom, children, safeAreaTop, ...props }, ref) => {
    return (
      <TScrollView {...props} ref={ref}>
        {safeAreaTop !== undefined && <Spacer height={safeAreaTop} />}
        {children}
        {safeAreaBottom !== undefined && <Spacer height={safeAreaBottom ?? 0} />}
      </TScrollView>
    )
  }
)

export type { ScrollView as ScrollViewRefType } from 'react-native'
