import { type ReactElement, cloneElement } from 'react'
import { AnimatedStack, Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { useScaleAnimation } from '../hooks/useScaleAnimation'

const messageBoxVariants = {
  light: {
    bg: '$grey-50',
    color: '$grey-700',
  },
  default: {
    bg: '$grey-500',
    color: '$white',
  },
  info: {
    bg: '$primary-500',
    color: '$white',
  },
  warning: {
    bg: '$warning-500',
    color: '$white',
  },
  error: {
    bg: '$danger-500',
    color: '$white',
  },
  success: {
    bg: '$positive-500',
    color: '$white',
  },
}

interface MessageBoxProps {
  message: string
  title?: string
  variant?: keyof typeof messageBoxVariants
  textVariant?: 'normal' | 'sub'
  icon?: ReactElement
  onPress?: () => void
}

export function MessageBox({
  message,
  textVariant = 'normal',
  variant = 'default',
  icon,
  title,
  onPress,
}: MessageBoxProps) {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  const container = (
    <XStack gap="$2" p="$3.5" bg={messageBoxVariants[variant].bg} borderRadius="$8">
      <YStack gap="$2" f={1}>
        {title && (
          <Heading variant="sub2" color={messageBoxVariants[variant].color}>
            {title}
          </Heading>
        )}
        <Paragraph f={1} color={messageBoxVariants[variant].color} variant={textVariant}>
          {message}
        </Paragraph>
      </YStack>
      {icon && (
        <Stack ai="center" jc="center">
          {cloneElement(icon, { color: messageBoxVariants[variant].color })}
        </Stack>
      )}
    </XStack>
  )

  if (onPress) {
    return (
      <AnimatedStack onPress={onPress} style={pressStyle} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {container}
      </AnimatedStack>
    )
  }

  return container
}
