import { Spinner as TSpinner, type SpinnerProps as TSpinnerProps } from 'tamagui'

interface SpinnerProps extends TSpinnerProps {
  size?: 'small' | 'large'
  variant?: 'light' | 'dark'
}

export function Spinner({ size = 'small', variant = 'light', ...props }: SpinnerProps) {
  return <TSpinner size={size} color={variant === 'dark' ? '$grey-100' : '$grey-900'} {...props} />
}
