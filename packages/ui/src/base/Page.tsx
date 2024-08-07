import { styled } from 'tamagui'

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from './Stacks'

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

export const FlexPage = styled(Stack, {
  name: 'FlexPage',
  backgroundColor: '$background',
  'flex-1': true,
  gap: '$6',
  padding: '$4',
  variants: {
    safeArea: {
      true: {},
      x: {},
      y: {},
      b: {},
      t: {},
      l: {},
      r: {},
    },
  },
  defaultVariants: {
    safeArea: true,
  },
}).styleable((props, ref) => {
  const safeAreaInsets = useSafeAreaInsets()

  const top =
    props.safeArea === true || props.safeArea === 'y' || props.safeArea === 't' ? safeAreaInsets.top : undefined
  const bottom =
    props.safeArea === true || props.safeArea === 'y' || props.safeArea === 'b' ? safeAreaInsets.bottom : undefined
  const left =
    props.safeArea === true || props.safeArea === 'x' || props.safeArea === 'l' ? safeAreaInsets.left : undefined
  const right =
    props.safeArea === true || props.safeArea === 'x' || props.safeArea === 'r' ? safeAreaInsets.right : undefined

  return <Stack {...props} ref={ref} top={top} left={left} right={right} bottom={bottom} />
})
