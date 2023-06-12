import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { useState, useCallback } from 'react'

const useBorderScroll = () => {
  const scrollEventThrottle = 48 // used to decrease precision to increase performance
  const [isBorderActive, setIsBorderActive] = useState(false)

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.y
    if (scrollPosition > 0) {
      setIsBorderActive(true)
    } else {
      setIsBorderActive(false)
    }
  }, [])

  return { isBorderActive, handleScroll, scrollEventThrottle }
}

export default useBorderScroll
