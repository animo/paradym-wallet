import { useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

const SCALE_FACTOR = 0.7

export function useImageScaler() {
  const [availableImageHeight, setAvailableImageHeight] = useState(0)

  return {
    height: availableImageHeight * SCALE_FACTOR,
    onLayout: (event: LayoutChangeEvent) => {
      if (availableImageHeight === 0) {
        setAvailableImageHeight(event.nativeEvent.layout.height)
      }
    },
  }
}
