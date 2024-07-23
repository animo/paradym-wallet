import { AlertOctagon, CornerDownRight, FileBadge, Inbox, RefreshCw, Scan, X } from '@tamagui/lucide-icons'
import type { NumberProp, SvgProps } from 'react-native-svg'

import { GlobeAltIcon as GlobeAlt } from 'react-native-heroicons/outline'
import { type ColorTokens, useTheme } from 'tamagui'

export const LucideIcon = {
  Scan,
  FileBadge,
  CornerDownRight,
  AlertOctagon,
  Inbox,
  X,
  RefreshCw,
}

interface HeroIconProps extends SvgProps {
  size?: NumberProp
  color?: ColorTokens
}

function wrapHeroIcon(Icon: React.FunctionComponent<HeroIconProps>) {
  return ({ color, ...props }: HeroIconProps) => {
    const theme = useTheme()
    // Map token to value or use the color directly if it's not a token
    const actualColor = color ? theme[color]?.val || color : undefined

    return <Icon {...props} color={actualColor} />
  }
}

export const HeroIcon = {
  GlobeAlt: wrapHeroIcon(GlobeAlt),
}
