import { Circle } from 'tamagui'
// Deep imports: the `base` and `content` barrels pull in components that animate through
// reanimated, and the credential request UI renders this without linking it.
import { Heading } from '../base/Headings'
import { Paragraph } from '../base/Paragraph'
import { Stack, XStack, YStack } from '../base/Stacks'
import { HeroIcons } from '../content/Icon'
import { Image } from '../content/Image'
import type { StatusVariant } from '../utils/variants'

const infoButtonVariants = {
  default: {
    icon: <HeroIcons.CheckCircleFilled color="background" />,
    accent: 'grey-500',
  },
  positive: {
    icon: <HeroIcons.ShieldCheckFilled color="background" />,
    accent: 'positive-500',
  },
  warning: {
    icon: <HeroIcons.ExclamationTriangleFilled color="background" />,
    accent: 'warning-500',
  },
  danger: {
    icon: <HeroIcons.ExclamationCircleFilled color="background" />,
    accent: 'danger-500',
  },
  info: {
    icon: <HeroIcons.InformationCircleFilled color="background" />,
    accent: 'grey-500',
  },

  // States
  expired: {
    icon: <HeroIcons.ClockFilled color="background" />,
    accent: 'grey-500',
  },
  view: {
    icon: <HeroIcons.Eye color="background" />,
    accent: 'primary-500',
  },
  'interaction-success': {
    icon: <HeroIcons.Interaction color="background" />,
    accent: 'positive-500',
  },
  'interaction-new': {
    icon: <HeroIcons.Interaction color="background" />,
    accent: 'grey-500',
  },
  unknown: {
    icon: <HeroIcons.ExclamationCircleFilled color="background" />,
    accent: 'grey-500',
  },
}

interface InfoButtonProps {
  variant?: StatusVariant | keyof typeof infoButtonVariants
  image?: {
    src: string | number
    alt: string
  }
  title: string
  description?: string
  onPress?: () => void
  routingType?: 'push' | 'modal' | 'external'
  noIcon?: boolean
  ariaLabel?: string
}

export function InfoButton({
  variant = 'default',
  image,
  title,
  description,
  onPress,
  routingType = 'push',
  noIcon,
  ariaLabel,
}: InfoButtonProps) {
  const isPressable = !!onPress

  return (
    <Stack
      transition={isPressable ? 'quick' : undefined}
      scale={isPressable ? '1 press:0.98' : undefined}
      flexDirection="row"
      gap="3"
      bg={isPressable ? 'grey-50' : 'surface'}
      shadow="card"
      px="4"
      py="3"
      borderColor="grey-100"
      rounded="8"
      borderWidth="1"
      accessible={true}
      accessibilityRole={onPress ? 'button' : undefined}
      aria-label={ariaLabel ?? (description ? `${title}. ${description}` : title)}
      onPress={onPress}
    >
      {!noIcon && (
        <Circle size="9" rounded="12" bg={infoButtonVariants[variant].accent}>
          {image ? <Image src={image.src} alt={image.alt} width={24} height={24} /> : infoButtonVariants[variant].icon}
        </Circle>
      )}
      <XStack grow={1} flex={1} items="center">
        <YStack gap="0-5" flex={1} grow={1}>
          <Heading maxFontSizeMultiplier={1.3} numberOfLines={2} heading="sub1">
            {title}
          </Heading>
          {description && <Paragraph fontSize={14}>{description}</Paragraph>}
        </YStack>
        {isPressable && (
          <Stack>
            {routingType === 'push' ? (
              <HeroIcons.ChevronRight size={20} color="grey-500" />
            ) : routingType === 'external' ? (
              <HeroIcons.Link size={20} color="grey-500" />
            ) : (
              <HeroIcons.InformationCircle size={20} color="grey-500" />
            )}
          </Stack>
        )}
      </XStack>
    </Stack>
  )
}
