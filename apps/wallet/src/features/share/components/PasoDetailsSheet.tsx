import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, FloatingSheet, Heading, Paragraph, YStack } from '@package/ui'
import type { PasoDetailClaim } from '@paradym/wallet-sdk'

/**
 * L8: who asked for the transaction, and the claims the issuer gave no label. [PaSO View] Section 2
 * allows these in a separate view. They're shown by their technical name, small, so they can't be
 * mistaken for the amount or the payee.
 */
export function PasoDetailsSheet({
  isOpen,
  setIsOpen,
  requestedBy,
  details,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  requestedBy: string
  details: PasoDetailClaim[]
}) {
  const { t } = useLingui()

  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <YStack p="5" gap="5">
        <Heading heading="h2">
          {t({ id: 'paso.details.title', message: 'Details', comment: 'Title of the sheet with payment details' })}
        </Heading>
        <YStack gap="0.5">
          <Paragraph variant="annotation">
            {t({
              id: 'paso.details.requestedBy',
              message: 'Requested by',
              comment: 'Label above the organization that sent the payment request',
            })}
          </Paragraph>
          <Paragraph color="grey-900" fontWeight="semiBold">
            {requestedBy}
          </Paragraph>
        </YStack>
        {details.length > 0 && (
          <YStack gap="3">
            <Paragraph variant="sub">
              {t({
                id: 'paso.details.unlabelledDescription',
                message:
                  'Also part of this request. Your bank gave these no label, so they are shown by their technical name.',
                comment: 'Explains the list of payment details that have no label of their own',
              })}
            </Paragraph>
            {details.map((detail) => (
              <YStack key={detail.path} gap="0.5">
                <Paragraph fontSize={12} color="grey-600" fontFamily="monospace">
                  {detail.path}
                </Paragraph>
                <Paragraph fontSize={13} color="grey-800" fontFamily="monospace">
                  {detail.value}
                </Paragraph>
              </YStack>
            ))}
          </YStack>
        )}
        <Button.Solid onPress={() => setIsOpen(false)}>{t(commonMessages.close)}</Button.Solid>
      </YStack>
    </FloatingSheet>
  )
}
