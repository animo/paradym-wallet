import { ChevronDown, ChevronUp, ChevronRight, ChevronLeft } from '@tamagui/lucide-icons'

type IconProps = {
  name: 'ChevronDown' | 'ChevronUp' | 'ChevronRight' | 'ChevronLeft'
}

export const Icon = ({ name }: IconProps) => {
  switch (name) {
    case 'ChevronDown':
      return <ChevronDown />
    case 'ChevronUp':
      return <ChevronUp />
    case 'ChevronRight':
      return <ChevronRight />
    case 'ChevronLeft':
      return <ChevronLeft />
    default:
      return null
  }
}
