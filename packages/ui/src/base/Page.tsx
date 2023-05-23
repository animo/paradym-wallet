import { styled } from 'tamagui'

import { Stack } from './Stacks'

// TODO: use safe-area-insets
export const Page = styled(Stack, {
  name: 'Page',
  backgroundColor: '$grey-200',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
})
