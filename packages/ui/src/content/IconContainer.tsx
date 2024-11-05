import { cloneElement } from 'react'
import type { StackProps } from 'tamagui'
import { AnimatedStack } from '../base'
import { useScaleAnimation } from '../hooks'

interface IconContainerProps extends StackProps {
  icon: React.ReactElement
  scaleOnPress?: boolean
  'aria-label'?: string
}

export function IconContainer({ icon, scaleOnPress = true, 'aria-label': ariaLabel, ...props }: IconContainerProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: scaleOnPress ? 0.9 : 1 })

  return (
    <AnimatedStack
      accessible={true}
      accessibilityRole="button"
      p="$2"
      m="$-2"
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      aria-label={ariaLabel}
      {...props}
    >
      {cloneElement(icon, {
        strokeWidth: icon.props.strokeWidth ?? 2,
        size: icon.props.size ?? 24,
        color: icon.props.color ?? '$grey-500',
      })}
    </AnimatedStack>
  )
}
