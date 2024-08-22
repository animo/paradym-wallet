import { Heading, Paragraph, YStack } from '@package/ui/src'
import { DualResponseButtons } from './DualResponseButtons'
import { FloatingSheet } from './FloatingSheet'

interface ConfirmationSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmationSheet({ isOpen, setIsOpen, onConfirm }: ConfirmationSheetProps) {
  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <YStack gap="$3">
        <Heading fontWeight="$semiBold" py="$2">
          Do you want to restart?
        </Heading>
        <Paragraph>You will lose all progress.</Paragraph>
      </YStack>
      <DualResponseButtons
        variant="confirmation"
        align="horizontal"
        acceptText="Restart"
        declineText="Cancel"
        onAccept={onConfirm}
        onDecline={() => {
          setIsOpen(false)
        }}
      />
    </FloatingSheet>
  )
}
