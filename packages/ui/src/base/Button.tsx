import { Button as TButton } from '@tamagui/button'
import { styled, withStaticProperties } from 'tamagui'

const Btn = styled(TButton, {
  name: 'Button',
  borderRadius: '$4',
  fontFamily: '$default',
  fontWeight: '$medium',
  pressStyle: {
    opacity: 0.8,
  },
})

export const SolidButton = styled(Btn, {
  backgroundColor: '$grey-900',
  color: '$grey-100',
})

const OutlineButton = styled(Btn, {
  backgroundColor: '$white',
  color: '$grey-900',
  borderColor: '$grey-300',
})

const TextButton = styled(Btn, {
  color: '$primary-500',
  borderWidth: 0,
})

export const Button = withStaticProperties(Btn, {
  Solid: SolidButton,
  Outline: OutlineButton,
  Text: TextButton,
})
