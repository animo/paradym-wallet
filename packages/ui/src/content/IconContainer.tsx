import { cloneElement } from 'react'
import type { StackProps } from 'tamagui'
import { AnimatedStack } from '../base'
import { useScaleAnimation } from '../hooks'

interface IconContainerProps extends StackProps {
  icon: React.ReactElement
  scaleOnPress?: boolean
}

export function IconContainer({ icon, scaleOnPress, ...props }: IconContainerProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: scaleOnPress ? 0.9 : 1 })

  return (
    <AnimatedStack p="$2" m="$-2" style={pressStyle} onPressIn={handlePressIn} onPressOut={handlePressOut} {...props}>
      {cloneElement(icon, {
        strokeWidth: icon.props.strokeWidth ?? 2,
        size: icon.props.size ?? 24,
        color: icon.props.color ?? '$grey-500',
      })}
    </AnimatedStack>
  )
}
