import { AlertOctagon, CornerDownRight, FileBadge, Inbox, RefreshCw, Scan, X } from '@tamagui/lucide-icons'
import type { NumberProp, SvgProps } from 'react-native-svg'

import {
  ArrowPathIcon,
  LockClosedIcon,
  GlobeAltIcon,
  IdentificationIcon,
  KeyIcon,
  StarIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from 'react-native-heroicons/outline'
import { styled } from 'tamagui'

export const LucideIcons = {
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
}

function wrapHeroIcon(Icon: React.FunctionComponent<HeroIconProps>) {
  return styled(
    (props: HeroIconProps) => <Icon {...props} />,
    {},
    {
      accept: {
        color: 'color',
      },
    }
  )
}

export type HeroIcon = ReturnType<typeof wrapHeroIcon>
export const HeroIcons = {
  GlobeAlt: wrapHeroIcon(GlobeAltIcon),
  Key: wrapHeroIcon(KeyIcon),
  Identification: wrapHeroIcon(IdentificationIcon),
  Star: wrapHeroIcon(StarIcon),
  ShieldCheck: wrapHeroIcon(ShieldCheckIcon),
  ArrowPath: wrapHeroIcon(ArrowPathIcon),
  LockClosed: wrapHeroIcon(LockClosedIcon),
  ArrowRight: wrapHeroIcon(ArrowRightIcon),
} as const
