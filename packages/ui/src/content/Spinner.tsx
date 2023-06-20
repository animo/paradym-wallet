import { Spinner as TSpinner } from 'tamagui'

interface SpinnerProps {
  size?: 'small' | 'large'
  variant?: 'light' | 'dark'
}

export function Spinner({ size = 'small', variant = 'light' }: SpinnerProps) {
  return <TSpinner size={size} color={variant === 'dark' ? '$grey-100' : '$grey-900'} />
}
