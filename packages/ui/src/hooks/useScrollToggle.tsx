import { type RefObject, useState } from 'react'
import type { ScrollViewRefType } from '../base'

interface UseScrollToggleOptions {
  scrollRef: RefObject<ScrollViewRefType>
  onVisibilityChange?: (isVisible: boolean) => void
  scrollDelay?: number
  closeDelay?: number
}

// This is a utility hook to toggle the visibility of a scroll view element
// It allows for a delay when hiding the element to allow for any UI updates (like closing sheets)
// And a delay when showing the element to allow for the scroll view to scroll to the element
export function useScrollToggle({
  scrollRef,
  onVisibilityChange,
  scrollDelay = 300,
  closeDelay = 200,
}: UseScrollToggleOptions) {
  const [isVisible, setIsVisible] = useState(false)
  const [elementPosition, setElementPosition] = useState(0)

  const toggle = () => {
    // Delay to allow any UI updates (like closing sheets)
    setTimeout(() => {
      const newVisibility = !isVisible

      if (!newVisibility) {
        // If hiding, scroll to top immediately
        scrollRef.current?.scrollTo({ y: 0, animated: true })
        setTimeout(() => {
          setIsVisible(false)
          onVisibilityChange?.(false)
        }, 100)
      } else {
        // If showing, delay scroll
        setIsVisible(true)
        onVisibilityChange?.(true)
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: elementPosition, animated: true })
        }, scrollDelay)
      }
    }, closeDelay)
  }

  return {
    isVisible,
    elementPosition,
    setElementPosition,
    toggle,
  }
}
