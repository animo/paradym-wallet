import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { useCallback, useState } from 'react'

export const useScrollViewPosition = (offset?: number) => {
  const scrollEventThrottle = 48 // used to decrease precision to increase performance
  const [isScrolledByOffset, setIsScrolledByOffset] = useState(false)

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pos = event.nativeEvent.contentOffset.y
      if (pos > (offset ? offset : 0)) {
        setIsScrolledByOffset(true)
      } else {
        setIsScrolledByOffset(false)
      }
    },
    [offset]
  )

  return { isScrolledByOffset, handleScroll, scrollEventThrottle }
}
