/**
 * Note: This file uses React Native's native `Animated` driver, not Reanimated so we can
 * keep React Native Reanimated out of the DC API App extension on iOS.
 */

import { Button as TButton } from '@tamagui/button'
import { View } from 'react-native'
import { styled, withStaticProperties } from 'tamagui'

const Btn = styled(TButton, {
  name: 'Button',
  accessible: true,
  accessibilityRole: 'button',
  userSelect: 'auto',
  borderRadius: '$button',
  fontFamily: '$default',
  fontWeight: '$medium',
  pressStyle: {
    opacity: 0.8,
  },
  variants: {
    scaleOnPress: {
      true: {
        // Overwrite pressStyle to scale instead of fade. Animated by Tamagui's own driver, which
        // is RN's `Animated` (see `animations.ts`) — reanimated would be a second runtime, and the
        // credential request UI's bundle does not link it.
        pressStyle: {
          opacity: 1,
          scale: 0.98,
        },
      },
    },
  },
  height: '$size.buttonHeight',
})

export const SolidButton = styled(Btn, {
  name: 'SolidButton',
  backgroundColor: '$grey-900',
  color: '$background',
  fontWeight: '$semiBold',
  variants: {
    small: {
      true: {
        h: '$3.5',
        px: '$5',
        br: '$12',
      },
    },
    light: {
      true: {
        bg: '$grey-100',
        color: '$grey-900',
      },
    },
  },
})

export const OutlineButton = styled(Btn, {
  name: 'OutlineButton',
  backgroundColor: '$background',
  color: '$grey-900',
  borderColor: '$grey-200',
  fontWeight: '$semiBold',
})

export const TextButton = styled(Btn, {
  name: 'TextButton',
  color: '$primary-500',
  fontWeight: '$semiBold',
  borderWidth: 0,
})

// The wrapper is what the button is laid out against — the button itself is `fg={1}` inside it —
// so it stays even though the scale now runs on the button.
export const AnimatedSolidButton = ({ ...props }: React.ComponentProps<typeof SolidButton>) => (
  <View style={{ flexDirection: 'row', flexGrow: props.flexGrow ? 1 : undefined }}>
    <SolidButton transition="quick" scaleOnPress fg={1} {...props} />
  </View>
)

const AnimatedOutlineButton = ({ ...props }: React.ComponentProps<typeof OutlineButton>) => (
  <View style={{ flexDirection: 'row', flexGrow: props.flexGrow ? 1 : undefined }}>
    <OutlineButton transition="quick" scaleOnPress fg={1} {...props} />
  </View>
)

const AnimatedTextButton = ({ ...props }: React.ComponentProps<typeof TextButton>) => (
  <View style={{ flexDirection: 'row', flexGrow: props.flexGrow ? 1 : undefined }}>
    {/* Text has no background to press against, so it takes a deeper scale than the filled ones. */}
    <TextButton transition="quick" pressStyle={{ opacity: 1, scale: 0.95 }} fg={1} {...props} />
  </View>
)

const SolidButtonWrapper = ({
  scaleOnPress,
  ...props
}: { scaleOnPress?: boolean } & React.ComponentProps<typeof Btn>) => {
  const Component = scaleOnPress ? AnimatedSolidButton : SolidButton
  return <Component {...props} />
}

const OutlineButtonWrapper = ({
  scaleOnPress,
  ...props
}: { scaleOnPress?: boolean } & React.ComponentProps<typeof Btn>) => {
  const Component = scaleOnPress ? AnimatedOutlineButton : OutlineButton
  return <Component {...props} />
}

const TextButtonWrapper = ({
  scaleOnPress,
  ...props
}: { scaleOnPress?: boolean } & React.ComponentProps<typeof Btn>) => {
  const Component = scaleOnPress ? AnimatedTextButton : TextButton
  return <Component {...props} />
}

export const Button = withStaticProperties(Btn, {
  Solid: SolidButtonWrapper,
  Outline: OutlineButtonWrapper,
  Text: TextButtonWrapper,
})
