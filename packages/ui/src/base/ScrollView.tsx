import { forwardRef, type Ref } from 'react'
import type { ScrollView as RNScrollView } from 'react-native'
import type { ScrollViewRef, ScrollViewProps as TScrollViewProps } from 'tamagui'
import { Spacer, ScrollView as TScrollView } from 'tamagui'

interface ScrollViewProps extends TScrollViewProps {
  safeAreaBottom?: number
  safeAreaTop?: number
}

export const ScrollView = forwardRef<RNScrollView, ScrollViewProps>(
  ({ safeAreaBottom, children, safeAreaTop, ...props }, ref) => {
    return (
      // On native the ref is React Native's ScrollView, v3 only types it for web
      <TScrollView {...props} ref={ref as unknown as Ref<ScrollViewRef>}>
        {safeAreaTop !== undefined && <Spacer height={safeAreaTop} />}
        {children}
        {safeAreaBottom !== undefined && <Spacer height={safeAreaBottom ?? 0} />}
      </TScrollView>
    )
  }
)

export type { ScrollView as ScrollViewRefType } from 'react-native'
