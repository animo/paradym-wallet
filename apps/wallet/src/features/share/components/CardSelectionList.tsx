// Deep imports: the credential request UI renders this too, and its bundle is separate from the
// app's — the `@package/ui` barrel would pull in the whole kit.
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button } from '@package/ui/base/Button'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { Stack, XStack, YStack } from '@package/ui/base/Stacks'
import { HeroIcons } from '@package/ui/content/Icon'
import type { FormattedSubmissionEntrySatisfiedCredential } from '@paradym/wallet-sdk'
import type { ReactNode } from 'react'
import { CardRow, useCardDetail } from './CardRow'

interface CardSelectionListProps {
  title: string
  cards: FormattedSubmissionEntrySatisfiedCredential[]
  selectedCardId: string
  onSelect: (credentialRecordId: string) => void
  onClose: () => void
  /** Draws a card's SVG template: the app and the credential request UI draw it differently. */
  artwork: (svgSource?: string) => ReactNode
}

/** The cards that can answer one requested card, to pick the one to share. */
export function CardSelectionList({
  title,
  cards,
  selectedCardId,
  onSelect,
  onClose,
  artwork,
}: CardSelectionListProps) {
  const { t } = useLingui()
  const cardDetail = useCardDetail()

  // Newest first, by when the card was issued. Picking a card moves it to the front of its entry, so
  // listing in that order would make the rows jump around.
  const issuedAt = ({ credential }: FormattedSubmissionEntrySatisfiedCredential) =>
    new Date(credential.metadata.issuedAt ?? credential.createdAt).getTime()
  const sortedCards = [...cards].sort((a, b) => issuedAt(b) - issuedAt(a))

  return (
    <Stack gap="5">
      <XStack justify="space-between" items="center">
        <Heading color="grey-900" heading="h2">
          {title}
        </Heading>
        <Stack
          ml="2"
          rounded="12"
          p="2"
          bg="grey-50"
          onPress={onClose}
          role="button"
          aria-label={t(commonMessages.close)}
        >
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
              accessible
              accessibilityRole="radio"
              aria-label={[card.credential.display.name ?? t(commonMessages.unknown), cardDetail(card)]
                .filter(Boolean)
                .join(', ')}
              aria-checked={isSelected}
              onPress={() => {
                if (!isSelected) onSelect(card.credential.record.id)
                onClose()
              }}
            >
              <CardRow
                card={card}
                compact
                artwork={artwork(card.credential.display.svg)}
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
  )
}

/** How many cards can answer a requested card, with the button that lists them. */
export function SwitchCardRow({
  count,
  onPress,
  disabled,
}: {
  count: number
  onPress: () => void
  disabled?: boolean
}) {
  const { t } = useLingui()

  return (
    <XStack items="center" justify="space-between" gap="2">
      <Paragraph variant="sub">{t(commonMessages.matchingCards(count))}</Paragraph>
      <Button.Solid
        h="9"
        px="4"
        rounded="12"
        bg="grey-100"
        color="grey-900"
        fontSize="2"
        disabled={disabled}
        onPress={onPress}
      >
        {t(commonMessages.switchCard)}
      </Button.Solid>
    </XStack>
  )
}
