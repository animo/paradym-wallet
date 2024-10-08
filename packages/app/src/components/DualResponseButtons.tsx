import { Button, Spinner, YStack } from '@package/ui'

interface DualResponseButtonProps {
  isLoading?: boolean
  onAccept: () => void
  onDecline: () => void
  acceptText?: string
  declineText?: string
  variant?: 'confirmation' | 'regular'
  align?: 'horizontal' | 'vertical'
}

export function DualResponseButtons({
  onAccept,
  onDecline,
  isLoading,
  align = 'vertical',
  acceptText = 'Accept',
  declineText = 'Decline',
  variant = 'regular',
}: DualResponseButtonProps) {
  return (
    <YStack gap="$2" py="$2" flexDirection={align === 'horizontal' ? 'row-reverse' : 'column'}>
      <Button.Solid
        f={1}
        disabled={isLoading}
        onPress={onAccept}
        {...(variant === 'confirmation' ? { bg: '$danger-500' } : {})}
      >
        {isLoading ? <Spinner variant="dark" /> : acceptText}
      </Button.Solid>
      <Button.Outline f={1} bg="$grey-100" disabled={isLoading} onPress={onDecline}>
        {declineText}
      </Button.Outline>
    </YStack>
  )
}
