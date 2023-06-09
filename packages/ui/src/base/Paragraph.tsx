import type { GetProps } from 'tamagui'

import { SizableText, styled } from 'tamagui'

export const Paragraph = styled(SizableText, {
  name: 'Paragraph',
  tag: 'p',
  userSelect: 'auto',
  color: '$grey-900',
  letterSpacing: '$true',
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
        opacity: 0.6,
      },
    },
    weight: {
      regular: {
        fontFamily: 'InterRegular',
      },
      medium: {
        fontFamily: 'Inter',
      },
      bold: {
        fontFamily: 'InterBold',
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
    },
  } as const,
  defaultVariants: {
    light: true,
    variant: 'normal',
    weight: 'medium',
  },
})

export type ParagraphProps = GetProps<typeof Paragraph>
