import { Button as TButton } from '@tamagui/button'
import { styled } from 'tamagui'

// Button variants are currently broken because RN splits the Button from the Text
// Temp fix by creating separate component for the button variants
const Button = styled(TButton, {
  name: 'Button',
  borderRadius: 8,
})

export const SolidButton = styled(Button, {
  backgroundColor: '$grey-900',
  color: '$grey-100',
})

export const OutlineButton = styled(Button, {
  backgroundColor: '$grey-100',
  color: '$grey-900',
})

export const TextButton = styled(Button, {
  color: '$primary-500',
  borderWidth: 0,
})
