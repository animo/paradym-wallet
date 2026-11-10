import { AnimatedStack, Heading, Stack, useScaleAnimation, XStack, YStack } from '@package/ui'
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

  // Two lines, broken at the space nearest the middle: "Scanner un / code QR" rather than "Scanner un code / QR"
  let spaceIndex = -1
  for (let index = 0; index < title.length; index++) {
    if (title[index] === ' ' && Math.abs(index - title.length / 2) < Math.abs(spaceIndex - title.length / 2)) {
      spaceIndex = index
    }
  }
  const titleParts = spaceIndex === -1 ? [title] : [title.slice(0, spaceIndex), title.slice(spaceIndex + 1)]

  return (
    <AnimatedStack
      style={qrPressStyle}
      onPressIn={qrHandlePressIn}
      onPressOut={qrHandlePressOut}
      onPress={onPress}
      justify="center"
      bg={variant === 'primary' ? 'grey-900' : 'white'}
      p="3"
      grow={1}
      flexBasis={0}
      gap="3"
      rounded="6"
    >
      <XStack justify="space-between" items="center">
        <Stack />
        {icon}
      </XStack>
      <YStack>
        {titleParts.map((word) => (
          // A word longer than the card, like Finnish "käyntiasioinnissa", shrinks rather than breaks
          <Heading
            key={word}
            color={variant === 'primary' ? 'white' : 'grey-900'}
            heading="h2"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {word}
          </Heading>
        ))}
      </YStack>
    </AnimatedStack>
  )
}
