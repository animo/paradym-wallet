import { Heading, Paragraph, Sheet, Stack } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DualResponseButtons } from './DualResponseButtons'

interface ConfirmationSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmationSheet({ isOpen, setIsOpen, onConfirm }: ConfirmationSheetProps) {
  const { bottom } = useSafeAreaInsets()

  return (
    <Sheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="$4" gap="$6" pb={bottom}>
        <Stack gap="$3">
          <Heading variant="h2">Are you sure you want to stop?</Heading>
          <Paragraph secondary>If you stop, no data will be shared.</Paragraph>
        </Stack>
        <Stack btw="$0.5" borderColor="$grey-200" mx="$-4" px="$4" pt="$4">
          <DualResponseButtons
            align="horizontal"
            variant="confirmation"
            acceptText="Yes, stop"
            declineText="No"
            onAccept={onConfirm}
            onDecline={() => setIsOpen(false)}
          />
        </Stack>
      </Stack>
    </Sheet>
  )
}
