import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { FloatingSheet, Heading, HeroIcons, Paragraph, Stack, XStack } from '@package/ui'
import { DualResponseButtons } from './DualResponseButtons'

const defaultTitleMessage = defineMessage({
  id: 'confirmationSheet.title',
  message: 'Are you sure you want to stop?',
})
const defaultDescriptionMessage = defineMessage({
  id: 'confirmationSheet.description',
  message: 'This action cannot be undone.',
})

interface ConfirmationSheetProps {
  variant?: 'confirmation' | 'regular'
  title?: string
  description?: string | string[]
  cancelText?: string
  confirmText?: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmationSheet({
  variant = 'confirmation',
  title,
  description,
  confirmText,
  cancelText,
  isOpen,
  setIsOpen,
  onConfirm,
  onCancel,
}: ConfirmationSheetProps) {
  const { t } = useLingui()
  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="$4" gap="$4">
        <XStack jc="space-between">
          <Heading color="$grey-900" variant="h2">
            {title || t(defaultTitleMessage)}
          </Heading>
          <Stack ml="$2" br="$12" p="$2" bg="$grey-50" onPress={() => setIsOpen(false)}>
            <HeroIcons.X size={16} strokeWidth={2.5} color="$grey-500" />
          </Stack>
        </XStack>
        <Stack borderBottomWidth="$0.5" borderColor="$grey-100" />
        {Array.isArray(description) ? (
          description.map((desc) => <Paragraph key={desc}>{desc}</Paragraph>)
        ) : (
          <Paragraph>{description || t(defaultDescriptionMessage)}</Paragraph>
        )}
        <DualResponseButtons
          align="horizontal"
          variant={variant}
          acceptText={confirmText || t(commonMessages.confirmStop)}
          declineText={cancelText || t(commonMessages.no)}
          onAccept={onConfirm}
          onDecline={onCancel || (() => setIsOpen(false))}
        />
      </Stack>
    </FloatingSheet>
  )
}
