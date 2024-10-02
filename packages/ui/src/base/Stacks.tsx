import Animated from 'react-native-reanimated'
import { ScrollView, type ScrollViewProps, type StackProps, Stack as TStack, styled } from 'tamagui'

export const Stack = styled(TStack, {
  name: 'Stack',
  variants: {
    'flex-1': {
      true: {
        flex: 1,
      },
    },
    shadow: {
      sm: {
        elevation: 3,
        shadowOffset: { width: 0, height: 4 },
        shadowColor: 'grey',
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      true: {
        elevation: 4,
        shadowOffset: { width: 3, height: 3 },
        shadowColor: 'grey',
        shadowOpacity: 0.15,
        shadowRadius: 12,
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

interface ScrollableStackProps extends StackProps {
  layout?: 'x' | 'y' | 'z'
  scrollViewProps?: ScrollViewProps
  ref?: React.Ref<ScrollView>
}

export const ScrollableStack = ({ layout, scrollViewProps, children, ref, ...props }: ScrollableStackProps) => {
  const AlignedStack = layout === 'x' ? XStack : layout === 'y' ? YStack : layout === 'z' ? ZStack : Stack

  return (
    <ScrollView ref={ref} w={scrollViewProps?.w ?? '100%'} alwaysBounceVertical={false} {...scrollViewProps}>
      <AlignedStack {...props}>{children}</AlignedStack>
    </ScrollView>
  )
}

export const AnimatedStack = Animated.createAnimatedComponent(Stack)
