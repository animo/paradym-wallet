import { styled } from 'tamagui'

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
