import { Button as TButton } from '@tamagui/button'
import { styled, withStaticProperties } from 'tamagui'

const Btn = styled(TButton, {
  name: 'Button',
  borderRadius: '$button',
  fontFamily: '$default',
  fontWeight: '$medium',
  pressStyle: {
    opacity: 0.8,
  },
  height: '$buttonHeight',
})

export const SolidButton = styled(Btn, {
  name: 'SolidButton',
  backgroundColor: '$grey-900',
  color: '$grey-100',
})

const OutlineButton = styled(Btn, {
  name: 'OutlineButton',

  backgroundColor: '$buttonOutlineBackgroundColor',
  borderColor: '$buttonOutlineBorderColor',
  color: '$buttonOutlineTextColor',
})

const TextButton = styled(Btn, {
  name: 'TextButton',
  color: '$primary-500',
  borderWidth: 0,
})

export const Button = withStaticProperties(Btn, {
  Solid: SolidButton,
  Outline: OutlineButton,
  Text: TextButton,
})
