import { Stack as TStack, styled } from 'tamagui'

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
        borderRadius: '$1',
      },
      sm: {
        borderRadius: '$2',
      },
      md: {
        borderRadius: '$3',
      },
      lg: {
        borderRadius: '$4',
      },
      xl: {
        borderRadius: '$8',
      },
    },
    g: {
      xs: {
        gap: '$1',
      },
      sm: {
        gap: '$2',
      },
      md: {
        gap: '$3',
      },
      lg: {
        gap: '$4',
      },
      xl: {
        gap: '$6',
      },
      '2xl': {
        gap: '$8',
      },
      '3xl': {
        gap: '$10',
      },
      '4xl': {
        gap: '$12',
      },
    },
    pad: {
      xs: {
        padding: '$1',
      },
      sm: {
        padding: '$2',
      },
      md: {
        padding: '$3',
      },
      lg: {
        padding: '$4',
      },
      xl: {
        padding: '$6',
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
