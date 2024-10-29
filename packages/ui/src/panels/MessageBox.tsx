import { type ReactElement, cloneElement } from 'react'
import { Paragraph, Stack, XStack } from '../base'

const messageBoxVariants = {
  default: {
    bg: '$primary-500',
  },
  info: {
    bg: '$primary-500',
  },
  warning: {
    bg: '$warning-500',
  },
  error: {
    bg: '$error-500',
  },
  success: {
    bg: '$success-500',
  },
}

interface MessageBoxProps {
  message: string
  variant?: keyof typeof messageBoxVariants
  icon?: ReactElement
}

export function MessageBox({ message, variant = 'default', icon }: MessageBoxProps) {
  return (
    <XStack gap="$2" p="$4" bg={messageBoxVariants[variant].bg} borderRadius="$8">
      <Paragraph f={1} color="$white">
        {message}
      </Paragraph>
      {icon && (
        <Stack ai="center" jc="center">
          {cloneElement(icon, { color: '$white' })}
        </Stack>
      )}
    </XStack>
  )
}
