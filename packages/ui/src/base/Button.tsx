/**
 * Note: This file uses React Native's native `Animated` driver, not Reanimated so we can
 * keep React Native Reanimated out of the DC API App extension on iOS.
 */

import { ButtonFrame, useButton } from '@tamagui/button'
import { Children, Fragment, type ReactNode } from 'react'
import { View } from 'react-native'
import { createStyledHOC, type GetProps, SizableText, styled, stylePropsTextOnly, withStaticProperties } from 'tamagui'

// v3's `tamagui` Button sizes itself from Config v6's sizing ladder, which our tokens don't have. This rebuilds
// what the v2 Button rendered at its default size from v3's unstyled parts.
const TButtonFrame = styled(ButtonFrame, {
  backgroundColor: 'background',
  borderWidth: 1,
  borderColor: 'transparent',
  paddingHorizontal: 18,
  gap: 9,
})

const TButtonText = styled(SizableText, {
  size: '3',
  flexGrow: 0,
  flexShrink: 1,
  userSelect: 'none',
})

const TButton = createStyledHOC(
  TButtonFrame,
  ({ ellipsis = true, ...props }: GetProps<typeof TButtonFrame> & Parameters<typeof useButton>[0], ref) => {
    // Text's own `ellipsis` variant sets `numberOfLines`, which v3 drops from variants on native
    const textProps = ellipsis
      ? { numberOfLines: 1, ellipsizeMode: 'tail' as const, ...props.textProps }
      : props.textProps
    // v2 gave each string child its own text, so `{label} <Icon />` has the frame's gap on both sides of the space.
    // v3 joins adjacent strings into one text, an empty fragment between them keeps them apart.
    const children = Children.toArray(props.children).flatMap((child, index): ReactNode[] =>
      typeof child === 'string' || typeof child === 'number' ? [child, <Fragment key={`text-${index}`} />] : [child]
    )
    const { props: buttonProps } = useButton(
      { ...props, children, textProps },
      {
        Text: TButtonText,
        iconSize: 16,
        iconColor: typeof props.color === 'string' ? props.color : undefined,
      }
    )
    return <TButtonFrame ref={ref} {...buttonProps} />
  },
  // Text props such as `color` and `fontWeight` go to the label, also when set in a styled() of this button
  {
    staticConfig: {
      inlineProps: new Set([...Object.keys(stylePropsTextOnly), 'ellipsis', 'numberOfLines', 'textProps']),
    },
  }
)

const Btn = styled(TButton, {
  name: 'Button',
  accessible: true,
  accessibilityRole: 'button',
  borderRadius: 'button',
  fontFamily: 'default',
  fontWeight: 'medium',
  opacity: '1 press:0.8',
  height: 'size.buttonHeight',
  variants: {
    scaleOnPress: {
      true: {
        // Overwrite pressStyle to scale instead of fade. Animated by Tamagui's own driver, which
        // is RN's `Animated` (see `animations.ts`) — reanimated would be a second runtime, and the
        // credential request UI's bundle does not link it.
        opacity: 1,
        scale: '1 press:0.98',
      },
    },
  },
})

export const SolidButton = styled(Btn, {
  name: 'SolidButton',
  backgroundColor: 'grey-900',
  color: 'background',
  fontWeight: 'semiBold',
  variants: {
    small: {
      true: {
        h: '3-5',
        px: '5',
        br: '12',
      },
    },
    light: {
      true: {
        bg: 'grey-100',
        color: 'grey-900',
      },
    },
  },
})

export const OutlineButton = styled(Btn, {
  name: 'OutlineButton',
  backgroundColor: 'background',
  color: 'grey-900',
  borderColor: 'grey-200',
  fontWeight: 'semiBold',
})

export const TextButton = styled(Btn, {
  name: 'TextButton',
  color: 'primary-500',
  fontWeight: 'semiBold',
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
    <TextButton transition="quick" opacity={1} scale="1 press:0.95" fg={1} {...props} />
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
