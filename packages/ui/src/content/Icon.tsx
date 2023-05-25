import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Scan,
  Wallet,
  FileBadge,
} from '@tamagui/lucide-icons'

type IconProps = {
  name:
    | 'ChevronDown'
    | 'ChevronUp'
    | 'ChevronRight'
    | 'ChevronLeft'
    | 'Scan'
    | 'Wallet'
    | 'FileBadge'
  color?: string
  filled?: boolean
}

//FIXME: find a better implementation, but we'll probably switch icon set later
export const Icon = ({ name, color, filled = false }: IconProps) => {
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
      return <Scan size="$2" color="$grey-900" opacity={filled ? 1 : 0.5} />
    case 'Wallet':
      return <Wallet size="$2" color="$grey-900" opacity={filled ? 1 : 0.5} />
    case 'FileBadge':
      return <FileBadge size="$2" color={color ?? '$grey-900'} />
    default:
      return null
  }
}
