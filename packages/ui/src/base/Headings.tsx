import type { GetProps } from 'tamagui'

import { styled, Heading as THeading } from 'tamagui'

export const Heading = styled(THeading, {
  name: 'Heading',
  tag: 'span',
  fontFamily: 'Inter',
  userSelect: 'auto',
  accessibilityRole: 'header',
  letterSpacing: '$2',
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
    variant: {
      title: {
        name: 'H1',
        tag: 'h1',
        size: '$7',
      },
      h1: {
        name: 'H1',
        tag: 'h1',
        size: '$6',
      },
      h2: {
        name: 'H2',
        tag: 'h2',
        size: '$5',
      },
      h3: {
        name: 'H2',
        tag: 'h2',
        size: '$4',
      },
    },
  } as const,
  defaultVariants: {
    light: true,
    variant: 'h1',
  },
})

export type HeadingProps = GetProps<typeof Heading>
