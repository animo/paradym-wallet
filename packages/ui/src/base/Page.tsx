import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createStyledHOC, type GetProps, styled } from 'tamagui'
import { useDeviceMedia } from '../hooks/useDeviceMedia'
import { Stack, XStack, YStack } from './Stacks'

export const Page = styled(Stack, {
  name: 'Page',
  backgroundColor: 'background',
  position: 'absolute',
  padding: '5',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
})

// Keeps one-column content readable in wide windows, such as the open iPhone Duo
const readableContentWidth = 600

const FlexPageBase = styled(Stack, {
  name: 'FlexPage',
  backgroundColor: 'background',
  gap: '6',
  paddingHorizontal: '5',
  'flex-1': true,
  width: '100%',
  maxWidth: readableContentWidth,
})

type SafeAreaEdge = 't' | 'b' | 'l' | 'r'

function getSafeAreaEdges(safeArea: boolean | 'x' | 'y' | SafeAreaEdge | SafeAreaEdge[]): SafeAreaEdge[] {
  if (safeArea === true) return ['t', 'b', 'l', 'r']
  if (safeArea === false) return []
  if (safeArea === 'x') return ['l', 'r']
  if (safeArea === 'y') return ['t', 'b']
  return Array.isArray(safeArea) ? safeArea : [safeArea]
}

export const FlexPage = createStyledHOC(
  FlexPageBase,
  (props: GetProps<typeof FlexPageBase> & { safeArea?: boolean | 'x' | 'y' | SafeAreaEdge | SafeAreaEdge[] }, ref) => {
    const safeAreaInsets = useSafeAreaInsets()
    const { additionalPadding } = useDeviceMedia()

    // Not defined means true, not sure why defaultVariant doesn't work
    const edges = getSafeAreaEdges(props.safeArea ?? true)

    // Some devices have no bottom safe area, so we add a default padding so the content is not against the edge
    const bottom = edges.includes('b') ? Math.max(safeAreaInsets.bottom, additionalPadding) : undefined

    // Some devices have little to no top safe area, so we add a default padding so the content is not against the edge
    const top = edges.includes('t') ? Math.max(safeAreaInsets.top, additionalPadding) : undefined
    const left = edges.includes('l') ? safeAreaInsets.left : undefined
    const right = edges.includes('r') ? safeAreaInsets.right : undefined

    return (
      <YStack
        backgroundColor={props.bg ?? props.backgroundColor ?? 'background'}
        h="100%"
        w="100%"
        items="center"
        pt={top}
        pl={left}
        pr={right}
        pb={bottom}
      >
        <FlexPageBase {...props} ref={ref} />
      </YStack>
    )
  }
)

interface TwoPaneProps {
  start: ReactNode
  end: ReactNode
}

/**
 * Two panes that meet in the middle of the window, where the iPhone Duo folds. Use it in a `FlexPage` without
 * horizontal padding or max width, on windows that match the `wide` media query.
 */
export function TwoPane({ start, end }: TwoPaneProps) {
  const { width } = useWindowDimensions()
  const { left } = useSafeAreaInsets()

  return (
    <XStack flex={1}>
      <YStack w={width / 2 - left} pr="2" borderRightWidth="1" borderColor="grey-200">
        {start}
      </YStack>
      <YStack flex={1} pl="2">
        {end}
      </YStack>
    </XStack>
  )
}
