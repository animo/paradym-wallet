import { Stack as TStack, styled } from 'tamagui'

import { paddingSizes } from '../tamagui.config'

export const Stack = styled(TStack, {
  name: 'Stack',
  padding: paddingSizes.lg,
  // variants: {
  //   pad: {
  //     xs: {
  //       padding: paddingSizes.xs,
  //     },
  //     sm: {
  //       padding: paddingSizes.sm,
  //     },
  //     md: {
  //       padding: paddingSizes.md,
  //     },
  //     lg: {
  //       padding: paddingSizes.lg,
  //     },
  //     xl: {
  //       padding: paddingSizes.xl,
  //     },
  //     '2xl': {
  //       padding: paddingSizes['2xl'],
  //     },
  //   } as const,
  // },
})

export const XStack = styled(Stack, {
  flexDirection: 'row',
})

export const YStack = styled(Stack, {
  flexDirection: 'column',
})

export const ZStack = styled(
  YStack,
  {
    flexDirection: 'column',
    position: 'relative',
  },
  {
    neverFlatten: true,
    isZStack: true,
  }
)
