import { useLingui } from '@lingui/react/macro'
import { credentialSvgArtwork } from '@package/app/components/CredentialSvg'
import { FloatingSheet, Heading, HeroIcons, Stack, XStack, YStack } from '@package/ui'
import type { FormattedSubmissionEntrySatisfiedCredential } from '@paradym/wallet-sdk'
import { PaymentCardRow } from './PaymentCardRow'

type PaymentCard = FormattedSubmissionEntrySatisfiedCredential

export { PaymentCardRow }

interface PaymentCardSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  cards: PaymentCard[]
  selectedCardId: string
  onSelect: (credentialRecordId: string) => void
}

export function PaymentCardSheet({ isOpen, setIsOpen, cards, selectedCardId, onSelect }: PaymentCardSheetProps) {
  const { t } = useLingui()

  // Picking a card moves it to the front of the submission. Listing in that order would make the
  // rows jump around, so the sheet keeps the order the cards were added in.
  const sortedCards = [...cards].sort((a, b) => a.credential.createdAt.getTime() - b.credential.createdAt.getTime())

  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="5" gap="5">
        <XStack justify="space-between" items="center">
          <Heading color="grey-900" heading="h2">
            {t({
              id: 'paso.payment.chooseCardTitle',
              message: 'Choose a payment card',
              comment: 'Title of the sheet where the user picks the card to authorize a payment with',
            })}
          </Heading>
          <Stack ml="2" rounded="12" p="2" bg="grey-50" onPress={() => setIsOpen(false)}>
            <HeroIcons.X size={16} strokeWidth={2.5} color="grey-500" />
          </Stack>
        </XStack>
        <Stack borderBottomWidth="1" borderColor="grey-100" />
        <YStack gap="2">
          {sortedCards.map((card) => {
            const isSelected = card.credential.record.id === selectedCardId
            return (
              <XStack
                key={card.credential.record.id}
                p="3"
                borderColor={isSelected ? 'primary-500' : 'grey-200'}
                opacity="1 press:0.8"
                rounded="6"
                borderWidth={1}
                accessibilityRole="radio"
                aria-checked={isSelected}
                onPress={() => {
                  if (!isSelected) onSelect(card.credential.record.id)
                  setIsOpen(false)
                }}
              >
                <PaymentCardRow
                  card={card}
                  artwork={credentialSvgArtwork(card.credential.display.svg)}
                  accessory={
                    isSelected ? (
                      <HeroIcons.CheckCircleFilled color="primary-500" size={24} />
                    ) : (
                      <HeroIcons.CheckCircle color="grey-300" size={24} />
                    )
                  }
                />
              </XStack>
            )
          })}
        </YStack>
      </Stack>
    </FloatingSheet>
  )
}
