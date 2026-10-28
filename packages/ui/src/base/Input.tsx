import { Input as TInput } from '@tamagui/input'
import { styled } from 'tamagui'

// v3's `tamagui` Input sizes and colors itself from Config v6's sizing ladder and theme keys, which our config doesn't
// have. These are the styles the v2 Input had at its default size.
export const Input = styled(TInput, {
  height: 44,
  borderRadius: 9,
  borderWidth: 1,
  paddingHorizontal: 16,
  fontFamily: 'body',
  fontSize: 16,
  fontWeight: '500',
  letterSpacing: -0.1,
  backgroundColor: 'background',
})
