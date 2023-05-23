import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Scan,
  Wallet,
} from '@tamagui/lucide-icons'

type IconProps = {
  name: 'ChevronDown' | 'ChevronUp' | 'ChevronRight' | 'ChevronLeft' | 'Scan' | 'Wallet'
  filled?: boolean
}

export const Icon = ({ name, filled = false }: IconProps) => {
  switch (name) {
    case 'ChevronDown':
      return <ChevronDown color="white" />
    case 'ChevronUp':
      return <ChevronUp />
    case 'ChevronRight':
      return <ChevronRight />
    case 'ChevronLeft':
      return <ChevronLeft />
    case 'Scan':
      return <Scan color={filled ? '$grey-900' : '$grey-500'} />
    case 'Wallet':
      return <Wallet color={filled ? '$grey-900' : '$grey-500'} />

    default:
      return null
  }
}
