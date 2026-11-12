// Deep imports throughout: the `@package/ui` and `@package/app` barrels pull in the whole kit, and this bundle is
// separate from the app's.
import { DualResponseButtons } from '@package/app/components/DualResponseButtons'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { Stack, YStack } from '@package/ui/base/Stacks'

/**
 * The app's confirmation sheet, inside the request UI: a sheet has no room for a second one, so the card rises
 * over the review within it, with the buttons where the review's were.
 */
export function DcApiConfirmationOverlay({
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  bottomInset,
  roundsTop,
}: {
  title: string
  description: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  bottomInset: number
  /** Whether the screen draws its own sheet, whose rounded top the scrim follows. */
  roundsTop: boolean
}) {
  return (
    <Stack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="darkTranslucent"
      justify="flex-end"
      px="3"
      pb={bottomInset}
      borderTopLeftRadius={roundsTop ? '8' : undefined}
      borderTopRightRadius={roundsTop ? '8' : undefined}
      transition="quick"
      opacity="1 enter:0"
      // Screen readers stay in the card, as touches do
      accessibilityViewIsModal
    >
      <YStack bg="surface" rounded="8" p="5" gap="5" transition="quick" y="0 enter:24px">
        <Heading heading="h2">{title}</Heading>
        <Stack borderBottomWidth="1" borderColor="grey-100" />
        <Paragraph>{description}</Paragraph>
        <DualResponseButtons
          align="horizontal"
          // On a narrow phone "Yes, continue" doesn't fit beside "No", so they stack rather than cut it off
          wrapLabels
          variant="confirmation"
          acceptText={confirmText}
          declineText={cancelText}
          onAccept={onConfirm}
          onDecline={onCancel}
        />
      </YStack>
    </Stack>
  )
}
