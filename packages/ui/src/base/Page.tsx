import { styled } from 'tamagui'

import { paddingSizes } from '../tamagui.config'

import { Stack } from './Stacks'

export const Page = styled(Stack, {
  name: 'Page',
  backgroundColor: '$grey-200',
  position: 'absolute',
  padding: paddingSizes.xl,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
})
