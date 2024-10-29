import { Button as TButton } from '@tamagui/button'
import Animated from 'react-native-reanimated'
import { styled, withStaticProperties } from 'tamagui'
import { useScaleAnimation } from '../hooks/useScaleAnimation'

const Btn = styled(TButton, {
  name: 'Button',
  borderRadius: '$button',
  fontFamily: '$default',
  fontWeight: '$medium',
  pressStyle: {
    opacity: 0.8,
  },
  variants: {
    scaleOnPress: {
      true: {
        // Overwrite pressStyle to use animated buttons
        pressStyle: {
          opacity: 1,
        },
      },
    },
  },
  height: '$size.buttonHeight',
})

export const SolidButton = styled(Btn, {
  name: 'SolidButton',
  backgroundColor: '$grey-900',
  color: '$white',
  fontWeight: '$semiBold',
})

export const OutlineButton = styled(Btn, {
  name: 'OutlineButton',
  backgroundColor: '$white',
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

export const AnimatedSolidButton = ({ ...props }: React.ComponentProps<typeof SolidButton>) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <Animated.View style={[pressStyle, { flexDirection: 'row', flexGrow: props.flexGrow ? 1 : undefined }]}>
      <SolidButton onPressIn={handlePressIn} onPressOut={handlePressOut} scaleOnPress fg={1} {...props} />
    </Animated.View>
  )
}

const AnimatedOutlineButton = ({ ...props }: React.ComponentProps<typeof OutlineButton>) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <Animated.View style={[pressStyle, { flexDirection: 'row', flexGrow: props.flexGrow ? 1 : undefined }]}>
      <OutlineButton onPressIn={handlePressIn} onPressOut={handlePressOut} scaleOnPress fg={1} {...props} />
    </Animated.View>
  )
}

const AnimatedTextButton = ({ ...props }: React.ComponentProps<typeof TextButton>) => {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation({ scaleInValue: 0.95 })

  return (
    <Animated.View style={[pressStyle, { flexDirection: 'row', flexGrow: props.flexGrow ? 1 : undefined }]}>
      <TextButton onPressIn={handlePressIn} onPressOut={handlePressOut} scaleOnPress fg={1} {...props} />
    </Animated.View>
  )
}

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
