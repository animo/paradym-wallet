import type { GetProps } from 'tamagui'

import { SizableText, styled } from 'tamagui'

export const Paragraph = styled(SizableText, {
  name: 'Paragraph',
  tag: 'p',
  userSelect: 'auto',
  color: '$grey-900',
  letterSpacing: '$true',
  fontFamily: '$inter',
  fontWeight: '$medium',
  variants: {
    light: {
      true: {
        color: '$grey-900',
      },
    },
    dark: {
      true: {
        color: '$grey-100',
      },
    },
    secondary: {
      true: {
        color: '$grey-600',
      },
    },
    variant: {
      normal: {
        size: '$3',
      },
      sub: {
        size: '$2',
      },
      annotation: {
        size: '$1',
      },
      text: {
        size: '$2',
        fontWeight: '$regular',
      },
    },
  } as const,
  defaultVariants: {
    light: true,
    variant: 'normal',
  },
})

export type ParagraphProps = GetProps<typeof Paragraph>
