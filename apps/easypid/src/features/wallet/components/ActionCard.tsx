import { AnimatedStack, Heading, Stack, XStack, YStack, useScaleAnimation } from '@package/ui'
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
      jc="center"
      bg={variant === 'primary' ? '$grey-900' : '$white'}
      p="$3"
      fg={1}
      gap="$3"
      br="$6"
    >
      <XStack jc="space-between" ai="center">
        <Stack />
        {icon}
      </XStack>
      <YStack>
        {title.split(' ').map((word) => (
          <Heading key={word} color={variant === 'primary' ? 'white' : '$grey-900'} variant="h2">
            {word}
          </Heading>
        ))}
      </YStack>
    </AnimatedStack>
  )
}
