import type { GetProps } from 'tamagui'

import { styled, Heading as THeading } from 'tamagui'

export const Heading = styled(THeading, {
  name: 'Heading',
  tag: 'span',
  fontFamily: '$heading',
  fontWeight: '$semiBold',
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
    center: {
      true: {
        textAlign: 'center',
      },
    },
    // Margin left is used to remove the whitespace that is added by the font-family
    heading: {
      h1: {
        name: 'H1',
        tag: 'h1',
        size: '$7',
        fontWeight: '$semiBold',
        lineHeight: '$6',
        letterSpacing: '$4',
        ml: -2,
      },
      h2: {
        name: 'H2',
        tag: 'h2',
        size: '$5',
        fontWeight: '$semiBold',
        letterSpacing: '$6',
        lineHeight: '$5',
        ml: -2,
      },
      h3: {
        name: 'H3',
        tag: 'h3',
        size: '$4',
        fontWeight: '$semiBold',
        letterSpacing: '$6',
        lineHeight: '$4',
      },
      h4: {
        name: 'H4',
        tag: 'h4',
        size: '$3',
        fontWeight: '$semiBold',
        letterSpacing: '$6',
        lineHeight: '$4',
      },
      sub1: {
        size: '$4',
        fontFamily: '$body',
        fontWeight: '$semiBold',
        letterSpacing: '$6',
        lineHeight: '$4',
      },
      sub2: {
        fontSize: 15,
        fontFamily: '$body',
        fontWeight: '$bold',
        textTransform: 'uppercase',
        color: '$grey-700',
        letterSpacing: '$5',
        lineHeight: '$3',
      },
    },
  } as const,
  defaultVariants: {
    light: true,
    heading: 'h1',
  },
})

export type HeadingProps = GetProps<typeof Heading>
