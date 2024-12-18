import { cloneElement } from 'react'
import { Circle, type StackProps } from 'tamagui'
import { AnimatedStack } from '../base'
import { useScaleAnimation } from '../hooks'

interface IconContainerProps extends Omit<StackProps, 'bg'> {
  icon: React.ReactElement
  scaleOnPress?: boolean
  bg?: boolean
  'aria-label'?: string
}

export function IconContainer({
  icon,
  scaleOnPress = true,
  bg = false,
  'aria-label': ariaLabel,
  ...props
}: IconContainerProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: scaleOnPress ? 0.9 : 1 })

  return (
    <AnimatedStack
      accessible={true}
      accessibilityRole="button"
      p="$3"
      m="$-3"
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      aria-label={ariaLabel}
      pos="relative"
      {...props}
    >
      {bg && <Circle pos="absolute" bg="$white" m="$2" size={36} />}
      {cloneElement(icon, {
        strokeWidth: icon.props.strokeWidth ?? 2,
        size: icon.props.size ?? 24,
        color: icon.props.color ?? '$grey-500',
      })}
    </AnimatedStack>
  )
}
