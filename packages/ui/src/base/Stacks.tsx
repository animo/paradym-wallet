import { Stack as TStack, styled } from 'tamagui'

import { borderRadiusSizes, gapSizes, paddingSizes } from '../tamagui.config'

export const Stack = styled(TStack, {
  name: 'Stack',
  variants: {
    'flex-1': {
      true: {
        flex: 1,
      },
    },
    shadow: {
      true: {
        elevation: 4,
        shadowOffset: { width: 5, height: 5 },
        shadowColor: 'grey',
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
    },
    border: {
      true: {
        borderWidth: 0.5,
        borderColor: '$grey-300',
      },
    },
    borderRad: {
      xs: {
        borderRadius: borderRadiusSizes.xs,
      },
      sm: {
        borderRadiusSizes: borderRadiusSizes.sm,
      },
      md: {
        borderRadiusSizes: borderRadiusSizes.md,
      },
      lg: {
        borderRadiusSizes: borderRadiusSizes.lg,
      },
      xl: {
        borderRadiusSizes: borderRadiusSizes.xl,
      },
      rounded: {
        borderRadiusSizes: borderRadiusSizes.rounded,
      },
    },
    g: {
      xs: {
        gap: gapSizes.xs,
      },
      sm: {
        gap: gapSizes.sm,
      },
      md: {
        gap: gapSizes.md,
      },
      lg: {
        gap: gapSizes.lg,
      },
      xl: {
        gap: gapSizes.xl,
      },
      '2xl': {
        gap: gapSizes['2xl'],
      },
      '3xl': {
        gap: gapSizes['3xl'],
      },
      '4xl': {
        gap: gapSizes['4xl'],
      },
    },
    pad: {
      xs: {
        padding: paddingSizes.xs,
      },
      sm: {
        padding: paddingSizes.sm,
      },
      md: {
        padding: paddingSizes.md,
      },
      lg: {
        padding: paddingSizes.lg,
      },
      xl: {
        padding: paddingSizes.xl,
      },
    },
  } as const,
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
