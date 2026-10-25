import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { FloatingSheet, Heading, HeroIcons, MiniCardRowItem, Paragraph, Stack, XStack, YStack } from '@package/ui'
import type { FormattedSubmissionEntrySatisfiedCredential } from '@paradym/wallet-sdk'
import type { ReactNode } from 'react'

type PaymentCard = FormattedSubmissionEntrySatisfiedCredential

/** `accessory` sits at the end of the masked IBAN line, so the card name keeps the full width. */
export function PaymentCardRow({ card, accessory }: { card: PaymentCard; accessory?: ReactNode }) {
  const { t } = useLingui()
  // WPA Rulebook Section 4.2: the masked IBAN is how the payer tells their payment cards apart, one
  // per account.
  const maskedIban = card.credential.rawAttributes.masked_iban

  return (
    <YStack gap="$2" f={1}>
      <MiniCardRowItem
        name={card.credential.display.name ?? t(commonMessages.unknown)}
        backgroundImageUri={card.credential.display.backgroundImage?.url}
        backgroundColor={card.credential.display.backgroundColor ?? '$white'}
        issuerImageUri={card.credential.display.issuer.logo?.url}
        subtitle={card.credential.display.issuer.name ?? t(commonMessages.unknown)}
      />
      {(typeof maskedIban === 'string' || accessory) && (
        <XStack ai="center" jc="space-between" gap="$2">
          <Paragraph variant="sub" color="$grey-700">
            {typeof maskedIban === 'string' ? maskedIban : ''}
          </Paragraph>
          {accessory}
        </XStack>
      )}
    </YStack>
  )
}

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
      <Stack p="$4" gap="$4">
        <XStack jc="space-between" ai="center">
          <Heading color="$grey-900" heading="h2">
            {t({
              id: 'paso.payment.chooseCardTitle',
              message: 'Choose a payment card',
              comment: 'Title of the sheet where the user picks the card to authorize a payment with',
            })}
          </Heading>
          <Stack ml="$2" br="$12" p="$2" bg="$grey-50" onPress={() => setIsOpen(false)}>
            <HeroIcons.X size={16} strokeWidth={2.5} color="$grey-500" />
          </Stack>
        </XStack>
        <Stack borderBottomWidth="$0.5" borderColor="$grey-100" />
        <YStack gap="$2">
          {sortedCards.map((card) => {
            const isSelected = card.credential.record.id === selectedCardId
            return (
              <XStack
                key={card.credential.record.id}
                p="$3"
                br="$6"
                bw={1}
                borderColor={isSelected ? '$primary-500' : '$grey-200'}
                accessibilityRole="radio"
                aria-checked={isSelected}
                pressStyle={{ opacity: 0.8 }}
                onPress={() => {
                  if (!isSelected) onSelect(card.credential.record.id)
                  setIsOpen(false)
                }}
              >
                <PaymentCardRow
                  card={card}
                  accessory={
                    isSelected ? (
                      <HeroIcons.CheckCircleFilled color="$primary-500" size={24} />
                    ) : (
                      <HeroIcons.CheckCircle color="$grey-300" size={24} />
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
