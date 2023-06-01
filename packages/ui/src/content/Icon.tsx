import { ChevronDown, ChevronUp, ChevronLeft, Scan } from '@tamagui/lucide-icons'

type IconProps = {
  name: 'ChevronDown' | 'ChevronUp' | 'ChevronLeft' | 'Scan' | 'Wallet' | 'FileBadge'
  color?: string
  filled?: boolean
}

//FIXME: find a better implementation, but we'll probably switch icon set later
export const Icon = ({ name, color }: IconProps) => {
  switch (name) {
    case 'ChevronDown':
      return <ChevronDown color={color ?? '$grey-100'} />
    case 'ChevronUp':
      return <ChevronUp color={color ?? '$grey-100'} />
    case 'ChevronLeft':
      return <ChevronLeft color={color ?? '$grey-100'} />
    case 'Scan':
      return <Scan size="$2" color={color ?? '$grey-900'} />
    default:
      return null
  }
}
