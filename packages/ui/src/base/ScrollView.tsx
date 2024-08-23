import type { ScrollViewProps as TScrollViewProps } from 'tamagui'

import { Spacer, ScrollView as TScrollView } from 'tamagui'

interface ScrollViewProps extends TScrollViewProps {
  safeAreaBottom?: number
  safeAreaTop?: number
}

export const ScrollView = ({ safeAreaBottom, children, safeAreaTop, ...props }: ScrollViewProps) => {
  return (
    <TScrollView {...props}>
      <Spacer height={safeAreaTop} />
      {children}
      <Spacer height={safeAreaBottom} />
    </TScrollView>
  )
}
