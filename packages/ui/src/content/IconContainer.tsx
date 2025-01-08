import { cloneElement } from 'react'
import { Circle, type StackProps } from 'tamagui'
import { AnimatedStack } from '../base'
import { useScaleAnimation } from '../hooks'

interface IconContainerProps extends Omit<StackProps, 'bg'> {
  icon: React.ReactElement
  scaleOnPress?: boolean
  bg?: 'white' | 'grey' | 'transparent'
  'aria-label'?: string
}

export function IconContainer({
  icon,
  scaleOnPress = true,
  bg = 'grey',
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
      bg={bg === 'white' ? '$white' : bg === 'grey' ? '$grey-50' : 'transparent'}
      br="$12"
      p="$2"
      mx="$-1"
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
