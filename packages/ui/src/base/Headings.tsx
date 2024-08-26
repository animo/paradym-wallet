import type { GetProps } from 'tamagui'

import { Heading as THeading, styled } from 'tamagui'

export const Heading = styled(THeading, {
  name: 'Heading',
  tag: 'span',
  fontFamily: '$heading',
  fontWeight: '$medium',
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
        fontWeight: '$semiBold',
      },
      h1: {
        name: 'H1',
        tag: 'h1',
        size: '$6',
        fontWeight: '$semiBold',
      },
      h2: {
        name: 'H2',
        tag: 'h2',
        size: '$5',
        fontWeight: '$medium',
        letterSpacing: -0.5,
      },
      h3: {
        name: 'H3',
        tag: 'h3',
        size: '$4',
        fontWeight: '$medium',
      },
      h4: {
        name: 'H4',
        tag: 'h4',
        size: '$3',
        fontWeight: '$medium',
      },
    },
  } as const,
  defaultVariants: {
    light: true,
    variant: 'h1',
  },
})

export type HeadingProps = GetProps<typeof Heading>
