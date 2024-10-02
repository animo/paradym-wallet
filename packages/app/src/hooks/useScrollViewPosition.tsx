import { Dimensions, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'

import { useCallback, useState } from 'react'

export const useScrollViewPosition = (offset?: number) => {
  const height = Dimensions.get('window').height

  const scrollEventThrottle = 48 // used to decrease precision to increase performance
  const [isScrolledByOffset, setIsScrolledByOffset] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [_, setContainerHeight] = useState(0)

  // This is not entirely accurate because it doesn't account for the safe area inset
  // So we override with the container height
  const isScrollable = contentHeight > height * 0.9
  // const isScrollable = contentHeight > containerHeight

  // @ts-ignore
  const onContentSizeChange = (_, height: number) => setContentHeight(height)
  const onLayout = (event: LayoutChangeEvent) => setContainerHeight(event.nativeEvent.layout.height)

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

  return { isScrolledByOffset, handleScroll, scrollEventThrottle, isScrollable, onContentSizeChange, onLayout }
}
