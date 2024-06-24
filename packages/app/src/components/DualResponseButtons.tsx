import { Button, Spinner, YStack } from '@package/ui'

interface DualResponseButtonProps {
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
}

export function DualResponseButtons({ onAccept, onDecline, isAccepting }: DualResponseButtonProps) {
  return (
    <YStack gap="$2" py="$2">
      <Button.Solid disabled={isAccepting} onPress={onAccept}>
        {isAccepting ? <Spinner variant="dark" /> : 'Accept'}
      </Button.Solid>
      <Button.Outline disabled={isAccepting} onPress={onDecline}>
        Decline
      </Button.Outline>
    </YStack>
  )
}
