import { Circle } from 'tamagui'
import { AnimatedStack, Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons, Image } from '../content'
import { useScaleAnimation } from '../hooks'
import type { StatusVariant } from '../utils/variants'

const infoButtonVariants = {
  default: {
    icon: <HeroIcons.CheckCircleFilled color="$white" />,
    accent: '$grey-500',
  },
  positive: {
    icon: <HeroIcons.ShieldCheckFilled color="$white" />,
    accent: '$positive-500',
  },
  warning: {
    icon: <HeroIcons.ExclamationTriangleFilled color="$white" />,
    accent: '$warning-500',
  },
  danger: {
    icon: <HeroIcons.ExclamationCircleFilled color="$white" />,
    accent: '$danger-500',
  },
  info: {
    icon: <HeroIcons.InformationCircleFilled color="$white" />,
    accent: '$grey-500',
  },

  // States
  expired: {
    icon: <HeroIcons.ClockFilled color="$white" />,
    accent: '$grey-500',
  },
  view: {
    icon: <HeroIcons.Eye color="$white" />,
    accent: '$primary-500',
  },
  'interaction-success': {
    icon: <HeroIcons.Interaction color="$white" />,
    accent: '$positive-500',
  },
  'interaction-new': {
    icon: <HeroIcons.Interaction color="$white" />,
    accent: '$grey-500',
  },
  unknown: {
    icon: <HeroIcons.ExclamationCircleFilled color="$white" />,
    accent: '$grey-500',
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
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <AnimatedStack
      style={isPressable ? pressStyle : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      flexDirection="row"
      gap="$4"
      br="$8"
      bg={isPressable ? '$grey-50' : '$white'}
      p="$3.5"
      bw="$0.5"
      accessible={true}
      accessibilityRole={onPress ? 'button' : undefined}
      aria-label={ariaLabel ?? `${title}. ${description}`}
      borderColor="$grey-100"
      onPress={onPress}
    >
      {!noIcon && (
        <Circle size="$3.5" br="$12" bg={infoButtonVariants[variant].accent}>
          {image ? <Image src={image.src} alt={image.alt} width={24} height={24} /> : infoButtonVariants[variant].icon}
        </Circle>
      )}
      <XStack fg={1} f={1} ai="center">
        <YStack gap="$1" f={1} fg={1}>
          <Heading maxFontSizeMultiplier={1.3} numberOfLines={1} heading="sub1">
            {title}
          </Heading>
          {description && (
            <Paragraph numberOfLines={2} fontSize={15}>
              {description}
            </Paragraph>
          )}
        </YStack>
        {isPressable && (
          <Stack>
            {routingType === 'push' ? (
              <HeroIcons.ChevronRight size={20} color="$grey-500" />
            ) : routingType === 'external' ? (
              <HeroIcons.Link size={20} color="$grey-500" />
            ) : (
              <HeroIcons.InformationCircle size={20} color="$grey-500" />
            )}
          </Stack>
        )}
      </XStack>
    </AnimatedStack>
  )
}
