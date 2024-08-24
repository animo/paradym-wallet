import { AlertOctagon, CornerDownRight, FileBadge, Inbox, RefreshCw, Scan, X } from '@tamagui/lucide-icons'
import { forwardRef } from 'react'
import type { NumberProp, SvgProps } from 'react-native-svg'

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BackspaceIcon,
  CheckCircleIcon,
  CircleStackIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ExclamationCircleIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  IdentificationIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  QrCodeIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
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

export interface HeroIconProps extends SvgProps {
  size?: NumberProp
}

function wrapHeroIcon(Icon: React.FunctionComponent<HeroIconProps>) {
  return styled(
    forwardRef((props: HeroIconProps, ref) => <Icon {...props} />),
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
  ArrowLeft: wrapHeroIcon(ArrowLeftIcon),
  Backspace: wrapHeroIcon(BackspaceIcon),
  ExclamationCircle: wrapHeroIcon(ExclamationCircleIcon),
  CheckCircle: wrapHeroIcon(CheckCircleIcon),
  Scan: wrapHeroIcon(QrCodeIcon),
  CreditCard: wrapHeroIcon(CreditCardIcon),
  DevicePhoneMobile: wrapHeroIcon(DevicePhoneMobileIcon),
  HandRaised: wrapHeroIcon(HandRaisedIcon),
  XCircle: wrapHeroIcon(XCircleIcon),
  InformationCircle: wrapHeroIcon(InformationCircleIcon),
  CircleStack: wrapHeroIcon(CircleStackIcon),
  X: wrapHeroIcon(XMarkIcon),
  QrCode: wrapHeroIcon(QrCodeIcon),
  QuestionMarkCircle: wrapHeroIcon(QuestionMarkCircleIcon),
  FingerPrint: wrapHeroIcon(FingerPrintIcon),
  User: wrapHeroIcon(UserIcon),
} as const
