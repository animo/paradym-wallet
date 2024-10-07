import {
  AlertOctagon,
  ArrowLeft,
  CornerDownRight,
  FileBadge,
  History,
  Inbox,
  ListFilter,
  RefreshCw,
  Scan,
  Trash2,
  X,
} from '@tamagui/lucide-icons'
import { forwardRef } from 'react'
import type { NumberProp, SvgProps } from 'react-native-svg'

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  BackspaceIcon,
  Bars3Icon,
  BuildingOfficeIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleStackIcon,
  Cog8ToothIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  IdentificationIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  NoSymbolIcon,
  QrCodeIcon,
  QuestionMarkCircleIcon,
  QueueListIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from 'react-native-heroicons/outline'
import {
  ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextFilledIcon,
  CheckCircleIcon as CheckCircleFilledIcon,
  Cog8ToothIcon as Cog8ToothFilledIcon,
  ExclamationCircleIcon as ExclamationCircleFilledIcon,
  IdentificationIcon as IdentificationFilledIcon,
  InformationCircleIcon as InformationCircleFilledIcon,
  QueueListIcon as QueueListFilledIcon,
  ShieldCheckIcon as ShieldCheckFilledIcon,
} from 'react-native-heroicons/solid'

import { styled } from 'tamagui'

export const LucideIcons = {
  Trash2,
  ArrowLeft,
  ListFilter,
  Scan,
  FileBadge,
  CornerDownRight,
  AlertOctagon,
  Inbox,
  X,
  RefreshCw,
  History,
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
  BuildingOffice: wrapHeroIcon(BuildingOfficeIcon),
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
  Bars3: wrapHeroIcon(Bars3Icon),
  EllipsisVertical: wrapHeroIcon(EllipsisVerticalIcon),
  Activity: wrapHeroIcon(QueueListIcon),
  Settings: wrapHeroIcon(Cog8ToothIcon),
  Feedback: wrapHeroIcon(ChatBubbleBottomCenterTextIcon),
  ChevronRight: wrapHeroIcon(ChevronRightIcon),
  Menu: wrapHeroIcon(Bars3Icon),
  Interaction: wrapHeroIcon(ArrowsRightLeftIcon),
  ExclamationCircleFilled: wrapHeroIcon(ExclamationCircleFilledIcon),
  NoSymbol: wrapHeroIcon(NoSymbolIcon),
  ShieldCheckFilled: wrapHeroIcon(ShieldCheckFilledIcon),
  Check: wrapHeroIcon(CheckIcon),
  InformationCircleFilled: wrapHeroIcon(InformationCircleFilledIcon),
  CheckCircleFilled: wrapHeroIcon(CheckCircleFilledIcon),
  QueueListFilled: wrapHeroIcon(QueueListFilledIcon),
  ChatBubbleBottomCenterTextFilled: wrapHeroIcon(ChatBubbleBottomCenterTextFilledIcon),
  Cog8ToothFilled: wrapHeroIcon(Cog8ToothFilledIcon),
  IdentificationFilled: wrapHeroIcon(IdentificationFilledIcon),
} as const
