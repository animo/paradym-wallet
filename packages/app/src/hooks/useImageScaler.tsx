import { useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

const SCALE_FACTOR = 0.7

export function useImageScaler({ scaleFactor = SCALE_FACTOR }: { scaleFactor?: number } = {}) {
  const [availableImageHeight, setAvailableImageHeight] = useState(0)

  return {
    height: availableImageHeight * scaleFactor,
    onLayout: (event: LayoutChangeEvent) => {
      if (availableImageHeight === 0) {
        setAvailableImageHeight(event.nativeEvent.layout.height)
      }
    },
  }
}
