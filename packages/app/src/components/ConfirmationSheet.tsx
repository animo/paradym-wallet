import { FloatingSheet, Heading, HeroIcons, Paragraph, Sheet, Stack, XStack } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DualResponseButtons } from './DualResponseButtons'

const DEFAULT_TITLE = 'Are you sure you want to stop?'
const DEFAULT_DESCRIPTION = 'This action cannot be undone.'

interface ConfirmationSheetProps {
  type?: 'regular' | 'floating'
  title?: string
  description?: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmationSheet({
  type = 'regular',
  title,
  description,
  isOpen,
  setIsOpen,
  onConfirm,
  onCancel,
}: ConfirmationSheetProps) {
  const { bottom } = useSafeAreaInsets()

  if (type === 'floating') {
    return (
      <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
        <Stack p="$4" gap="$4">
          <XStack jc="space-between">
            <Heading color="$grey-900" variant="h2">
              {title || DEFAULT_TITLE}
            </Heading>
            <Stack ml="$2" br="$12" p="$2" bg="$grey-50" onPress={() => setIsOpen(false)}>
              <HeroIcons.X size={16} strokeWidth={2.5} color="$grey-500" />
            </Stack>
          </XStack>
          <Stack borderBottomWidth="$0.5" borderColor="$grey-100" />
          <Paragraph>{description || DEFAULT_DESCRIPTION}</Paragraph>
          <DualResponseButtons
            align="horizontal"
            variant="confirmation"
            acceptText="Yes, stop"
            declineText="No"
            onAccept={onConfirm}
            onDecline={onCancel || (() => setIsOpen(false))}
            removeBottomPadding
          />
        </Stack>
      </FloatingSheet>
    )
  }

  return (
    <Sheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="$4" gap="$6" pb={bottom}>
        <Stack gap="$3">
          <Heading variant="h2">{title || DEFAULT_TITLE}</Heading>
          <Paragraph secondary>{description || DEFAULT_DESCRIPTION}</Paragraph>
        </Stack>
        <Stack btw="$0.5" borderColor="$grey-200" mx="$-4" px="$4" pt="$4">
          <DualResponseButtons
            align="horizontal"
            variant="confirmation"
            acceptText="Yes, stop"
            declineText="No"
            onAccept={onConfirm}
            onDecline={onCancel || (() => setIsOpen(false))}
          />
        </Stack>
      </Stack>
    </Sheet>
  )
}
