import type { GetProps } from 'tamagui'

import { SizableText, styled } from 'tamagui'

export const Paragraph = styled(SizableText, {
  name: 'Paragraph',
  tag: 'p',
  accessibilityRole: 'text',
  userSelect: 'auto',
  color: '$grey-700',
  fontFamily: '$default',
  fontWeight: '$regular',
  variants: {
    light: {
      true: {
        color: '$grey-700',
      },
    },
    dark: {
      true: {
        color: '$grey-200',
      },
    },
    secondary: {
      true: {
        color: '$grey-600',
      },
    },
    center: {
      true: {
        textAlign: 'center',
      },
    },
    emphasis: {
      true: {
        fontWeight: '$bold',
        color: '$grey-900',
      },
    },
    variant: {
      normal: {
        size: '$3',
        lineHeight: '$5',
        letterSpacing: '$8',
      },
      sub: {
        size: '$2',
        lineHeight: '$3',
        letterSpacing: '$8',
      },
      annotation: {
        size: '$2',
        lineHeight: '$5',
        letterSpacing: '$8',
      },
      caption: {
        size: '$2',
        lineHeight: '$5',
        letterSpacing: '$2',
        fontWeight: '$semiBold',
      },
    },
  } as const,
  defaultVariants: {
    light: true,
    variant: 'normal',
  },
})

export type ParagraphProps = GetProps<typeof Paragraph>
