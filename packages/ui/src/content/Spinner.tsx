import { Spinner as TSpinner } from 'tamagui'

interface SpinnerProps {
  size?: 'small' | 'large'
}

export function Spinner({ size = 'small' }: SpinnerProps) {
  return <TSpinner size={size} color="$grey-900" />
}
