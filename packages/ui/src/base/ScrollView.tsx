import type { ScrollViewProps as TScrollViewProps } from 'tamagui'

import { Spacer, ScrollView as TScrollView } from 'tamagui'

interface ScrollViewProps extends TScrollViewProps {
  safeAreaBottom?: number
}

export const ScrollView = ({ safeAreaBottom, children, ...props }: ScrollViewProps) => {
  return (
    <TScrollView {...props}>
      {children}
      <Spacer height={safeAreaBottom} />
    </TScrollView>
  )
}
