import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styled } from 'tamagui'
import { useDeviceMedia } from '../hooks/useDeviceMedia'
import { Stack, YStack } from './Stacks'

export const Page = styled(Stack, {
  name: 'Page',
  backgroundColor: '$background',
  position: 'absolute',
  padding: '$4',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
})

const FlexPageBase = styled(Stack, {
  name: 'FlexPage',
  backgroundColor: '$background',
  'flex-1': true,
  gap: '$6',
  paddingHorizontal: '$4',
})

export const FlexPage = FlexPageBase.styleable<{ safeArea?: boolean | 'x' | 'y' | 'l' | 'b' | 't' | 'r' }>(
  (props, ref) => {
    const safeAreaInsets = useSafeAreaInsets()
    const { additionalPadding } = useDeviceMedia()

    // Not defined means true, not sure why defaultVariant doesn't work
    const safeArea = props.safeArea ?? true

    // Some devices have no bottom safe area, so we add a default padding so the content is not against the edge
    const bottom =
      safeArea === true || safeArea === 'y' || safeArea === 'b'
        ? Math.max(safeAreaInsets.bottom, additionalPadding)
        : undefined

    // Some devices have little to no top safe area, so we add a default padding so the content is not against the edge
    const top =
      safeArea === true || safeArea === 'y' || safeArea === 't'
        ? Math.max(safeAreaInsets.top, additionalPadding)
        : undefined
    const left = safeArea === true || safeArea === 'x' || safeArea === 'l' ? safeAreaInsets.left : undefined
    const right = safeArea === true || safeArea === 'x' || safeArea === 'r' ? safeAreaInsets.right : undefined

    return (
      <YStack bg={props.bg ?? props.backgroundColor ?? '$background'} h="100%" w="100%">
        <FlexPageBase
          {...props}
          ref={ref}
          marginTop={top}
          marginLeft={left}
          marginRight={right}
          marginBottom={bottom}
        />
      </YStack>
    )
  }
)
