import type { GetProps } from 'tamagui'

import { SizableText, styled } from 'tamagui'

// Not on v3's Heading: it makes text selectable, which v2 headings weren't, and on Android that drops the ellipsis
// of `numberOfLines`
export const Heading = styled(SizableText, {
  name: 'Heading',
  role: 'heading',
  margin: 0,
  fontFamily: 'heading',
  fontWeight: 'semiBold',
  letterSpacing: '2',
  color: 'grey-900',
  accessibilityRole: 'header',
  variants: {
    light: {
      true: {
        color: 'grey-900',
      },
    },
    dark: {
      true: {
        color: 'grey-100',
      },
    },
    secondary: {
      true: {
        color: 'grey-700',
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
        size: '7',
        fontWeight: 'semiBold',
        lineHeight: '6',
        letterSpacing: '4',
        ml: -2,
      },
      h2: {
        size: '5',
        fontWeight: 'semiBold',
        letterSpacing: '6',
        lineHeight: '5',
        ml: -2,
      },
      h3: {
        size: '4',
        fontWeight: 'semiBold',
        letterSpacing: '6',
        lineHeight: '4',
      },
      h4: {
        size: '3',
        fontWeight: 'semiBold',
        letterSpacing: '6',
        lineHeight: '4',
      },
      sub1: {
        size: '4',
        fontFamily: 'body',
        fontWeight: 'semiBold',
        letterSpacing: '6',
        lineHeight: '4',
      },
      sub2: {
        fontSize: 15,
        fontFamily: 'body',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: 'grey-700',
        letterSpacing: '5',
        lineHeight: '3',
      },
    },
  } as const,
  defaultVariants: {
    light: true,
    heading: 'h1',
  },
})

export type HeadingProps = GetProps<typeof Heading>
