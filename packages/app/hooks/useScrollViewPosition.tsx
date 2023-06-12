import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { useState, useCallback } from 'react'

const useScrollViewPosition = (offset?: number) => {
  const scrollEventThrottle = 48 // used to decrease precision to increase performance
  const [isScrolledByOffset, setIsScrolledByOffset] = useState(false)

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pos = event.nativeEvent.contentOffset.y
    if (pos > (offset ? offset : 0)) {
      setIsScrolledByOffset(true)
    } else {
      setIsScrolledByOffset(false)
    }
  }, [])

  return { isScrolledByOffset, handleScroll, scrollEventThrottle }
}

export default useScrollViewPosition
