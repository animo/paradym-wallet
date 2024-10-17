import { Circle } from 'tamagui'
import { AnimatedStack, Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons, Image } from '../content'
import { useScaleAnimation } from '../hooks'

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

  // States
  expired: {
    icon: <HeroIcons.ClockFilled color="$white" />,
    accent: '$grey-500',
  },
  view: {
    icon: <HeroIcons.Eye color="$white" />,
    accent: '$primary-500',
  },
}

interface InfoButtonProps {
  variant?: keyof typeof infoButtonVariants
  image?: {
    src: string | number
    alt: string
  }
  title: string
  description: string
  onPress?: () => void
  routingType?: 'push' | 'modal'
}

export function InfoButton({
  variant = 'default',
  image,
  title,
  description,
  onPress,
  routingType = 'push',
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
      p="$4"
      bw="$0.5"
      borderColor="$grey-100"
      onPress={onPress}
    >
      <Circle size="$4" br="$12" bg={infoButtonVariants[variant].accent}>
        {image ? <Image src={image.src} alt={image.alt} width={24} height={24} /> : infoButtonVariants[variant].icon}
      </Circle>
      <XStack fg={1} ai="center" jc="space-between">
        <YStack>
          <Heading variant="h3">{title}</Heading>
          <Paragraph fontWeight="$regular">{description}</Paragraph>
        </YStack>
        {isPressable && (
          <Stack>
            {routingType === 'push' ? (
              <HeroIcons.ChevronRight size={20} color="$grey-500" />
            ) : (
              <HeroIcons.InformationCircle size={20} color="$grey-500" />
            )}
          </Stack>
        )}
      </XStack>
    </AnimatedStack>
  )
}
