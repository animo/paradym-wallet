import type { ScrollViewProps as TScrollViewProps } from 'tamagui'

import { Spacer, ScrollView as TScrollView } from 'tamagui'

interface ScrollViewProps extends TScrollViewProps {
  safeAreaBottom?: number
  safeAreaTop?: number
}

export const ScrollView = ({ safeAreaBottom, children, safeAreaTop, ...props }: ScrollViewProps) => {
  return (
    <TScrollView {...props}>
      {safeAreaTop !== undefined && <Spacer height={safeAreaTop} />}
      {children}
      {safeAreaBottom !== undefined && <Spacer height={safeAreaBottom ?? 0} />}
    </TScrollView>
  )
}
