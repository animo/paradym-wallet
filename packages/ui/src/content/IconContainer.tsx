import { cloneElement } from 'react'
import type { ViewProps } from 'tamagui'
// Deep import: the `base` barrel pulls in components that animate through reanimated, and the
// credential request UI renders this without linking it.
import { Stack } from '../base/Stacks'

const variantStyles = {
  default: {
    bg: '$grey-50',
    color: '$grey-500',
  },
  danger: {
    bg: '$danger-300',
    color: '$danger-600',
  },
  regular: {
    bg: '$grey-50',
    color: '$grey-900',
  },
  primary: {
    bg: '$grey-50',
    color: '$primary-500',
  },
}

export interface IconContainerProps extends ViewProps {
  icon: React.ReactElement<{ strokeWidth?: number; size?: number; color?: string }>
  scaleOnPress?: boolean
  radius?: 'full' | 'normal'
  variant?: keyof typeof variantStyles
  'aria-label'?: string
}

export function IconContainer({
  icon,
  scaleOnPress = true,
  radius = 'full',
  variant = 'default',
  'aria-label': ariaLabel,
  ...props
}: IconContainerProps) {
  const isPressable = !!props.onPress

  return (
    <Stack
      accessible={true}
      accessibilityRole="button"
      transition={isPressable ? 'quick' : undefined}
      pressStyle={isPressable ? { scale: scaleOnPress ? 0.9 : 1 } : undefined}
      aria-label={ariaLabel}
      bg={variantStyles[variant].bg}
      br={radius === 'full' ? '$12' : '$4'}
      p="$2"
      mx="$-1"
      {...props}
    >
      {cloneElement(icon, {
        strokeWidth: icon.props.strokeWidth ?? 2,
        size: icon.props.size ?? 24,
        color: icon.props.color ?? variantStyles[variant].color,
      })}
    </Stack>
  )
}
