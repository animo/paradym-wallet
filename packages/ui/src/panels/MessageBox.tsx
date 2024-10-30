import { type ReactElement, cloneElement } from 'react'
import { Paragraph, Stack, XStack } from '../base'

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
    bg: '$success-500',
    color: '$white',
  },
}

interface MessageBoxProps {
  message: string
  variant?: keyof typeof messageBoxVariants
  textVariant?: 'normal' | 'sub'
  icon?: ReactElement
}

export function MessageBox({ message, textVariant = 'normal', variant = 'default', icon }: MessageBoxProps) {
  return (
    <XStack gap="$2" p="$3.5" bg={messageBoxVariants[variant].bg} borderRadius="$8">
      <Paragraph f={1} color={messageBoxVariants[variant].color} variant={textVariant}>
        {message}
      </Paragraph>
      {icon && (
        <Stack ai="center" jc="center">
          {cloneElement(icon, { color: messageBoxVariants[variant].color })}
        </Stack>
      )}
    </XStack>
  )
}
