import type { GetProps } from 'tamagui'

import { styled, Heading as THeading } from 'tamagui'

export const Heading = styled(THeading, {
  name: 'Heading',
  tag: 'span',
  fontFamily: '$medium',
  userSelect: 'auto',
  accessibilityRole: 'header',
  letterSpacing: '$2',
  color: '$grey-900',
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
        color: '$grey-700',
        opacity: 0.85,
      },
    },
    variant: {
      title: {
        name: 'H1',
        tag: 'h1',
        size: '$7',
        fontFamily: '$semiBold',
      },
      h1: {
        name: 'H1',
        tag: 'h1',
        size: '$6',
        fontFamily: '$semiBold',
      },
      h2: {
        name: 'H2',
        tag: 'h2',
        size: '$5',
        fontFamily: '$medium',
      },
      h3: {
        name: 'H3',
        tag: 'h3',
        size: '$3',
        fontFamily: '$medium',
      },
    },
  } as const,
  defaultVariants: {
    light: true,
    variant: 'h1',
  },
})

export type HeadingProps = GetProps<typeof Heading>
