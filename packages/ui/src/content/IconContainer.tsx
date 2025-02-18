import { cloneElement } from 'react'
import type { StackProps } from 'tamagui'
import { AnimatedStack } from '../base'
import { useScaleAnimation } from '../hooks'

interface IconContainerProps extends StackProps {
  icon: React.ReactElement
  scaleOnPress?: boolean
  radius?: 'full' | 'normal'
  variant?: 'default' | 'regular' | 'danger'
  'aria-label'?: string
}

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
}
export function IconContainer({
  icon,
  scaleOnPress = true,
  radius = 'full',
  variant = 'default',
  'aria-label': ariaLabel,
  ...props
}: IconContainerProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: scaleOnPress ? 0.9 : 1 })

  return (
    <AnimatedStack
      accessible={true}
      accessibilityRole="button"
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
        color: variantStyles[variant].color,
      })}
    </AnimatedStack>
  )
}
