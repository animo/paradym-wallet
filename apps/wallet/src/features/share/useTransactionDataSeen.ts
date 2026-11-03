import { useCallback, useRef, useState } from 'react'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

// The content container's vertical padding sits between the block's own coordinates and the
// measurements of the viewport, so the comparison carries a tolerance rather than depending on the
// exact value of the padding token.
const measurementTolerance = 24

/**
 * [PaSO Core] Section 5.3 and [PaSO View] Section 2: the claims designated for display, and the
 * `security_hint`, have to have been *shown* before the confirmation action is enabled.
 *
 * What has to have been seen is the transaction data — not the bottom of the screen. The card
 * preview and the requested attributes below it are not transaction data, so gating on reaching the
 * end of the scroll area asks for more than the rule does. It also breaks: when the content happens
 * to fit there is nothing to scroll, so an escape hatch has to recognise that, and if the
 * measurement behind it never reports the user is left with a confirmation action that can never
 * be enabled and nothing on screen explaining why.
 *
 * Hence two things. The measurement is of the transaction data block itself — `y + height` is where
 * it ends within the scrollable content, so the block has to be a direct child of it — and *three*
 * independent measurements feed how much of the content has been seen: the container height, the
 * scroll view's own height, and the visible region reported while scrolling. Any one of them opens
 * the gate, so no single platform callback failing to fire can wedge the screen. On a normal screen
 * the block is in view from the first layout and the action is enabled immediately; on a small one,
 * or with large accessibility text, it correctly takes a scroll.
 */
export function useTransactionDataSeen() {
  const [hasSeenTransactionData, setHasSeenTransactionData] = useState(false)
  const transactionDataEnd = useRef<number | undefined>(undefined)
  const seenContentDepth = useRef(0)

  const markSeen = useCallback((contentDepth: number) => {
    seenContentDepth.current = Math.max(seenContentDepth.current, contentDepth)

    const end = transactionDataEnd.current
    if (end !== undefined && seenContentDepth.current + measurementTolerance >= end) {
      setHasSeenTransactionData(true)
    }
  }, [])

  return {
    hasSeenTransactionData,
    /** On the transaction data block. */
    onTransactionDataLayout: (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout
      transactionDataEnd.current = y + height
      markSeen(0)
    },
    /** On the scroll view, and on the container it fills. */
    onViewportLayout: (event: LayoutChangeEvent) => markSeen(event.nativeEvent.layout.height),
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent
      markSeen(contentOffset.y + layoutMeasurement.height)
    },
  }
}
