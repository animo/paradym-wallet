import { AnimatedStack, Heading, Stack, useScaleAnimation } from '@package/ui'
import type { ReactNode } from 'react'

interface ActionCardProps {
  variant?: 'primary' | 'secondary'
  icon: ReactNode
  title: string
  onPress: () => void
}

export function ActionCard({ icon, title, onPress, variant = 'primary' }: ActionCardProps) {
  const {
    pressStyle: qrPressStyle,
    handlePressIn: qrHandlePressIn,
    handlePressOut: qrHandlePressOut,
  } = useScaleAnimation({ scaleInValue: 0.95 })

  return (
    <AnimatedStack
      style={qrPressStyle}
      onPressIn={qrHandlePressIn}
      onPressOut={qrHandlePressOut}
      onPress={onPress}
      ai="center"
      jc="center"
      bg={variant === 'primary' ? '$grey-900' : '$white'}
      py="$4"
      px="$6"
      gap="$4"
      br="$6"
    >
      <Stack>{icon}</Stack>
      <Heading color={variant === 'primary' ? 'white' : '$grey-900'} variant="h2">
        {title}
      </Heading>
    </AnimatedStack>
  )
}
