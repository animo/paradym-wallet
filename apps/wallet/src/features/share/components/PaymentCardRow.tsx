// Deep imports: the credential request UI renders this too, and its bundle is separate from the
// app's — the `@package/ui` barrel would pull in the whole kit.
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Paragraph } from '@package/ui/base/Paragraph'
import { XStack, YStack } from '@package/ui/base/Stacks'
import { MiniCardRowItem } from '@package/ui/components/MiniCardRowItem'
import type { FormattedSubmissionEntrySatisfiedCredential } from '@paradym/wallet-sdk'
import type { ReactNode } from 'react'

type PaymentCard = FormattedSubmissionEntrySatisfiedCredential

/**
 * `accessory` sits at the end of the masked IBAN line, so the card name keeps the full width.
 * `artwork` is the card's rendered SVG template: the app and the credential request UI draw it
 * differently, so they pass it in.
 */
export function PaymentCardRow({
  card,
  accessory,
  artwork,
}: {
  card: PaymentCard
  accessory?: ReactNode
  artwork?: ReactNode
}) {
  const { t } = useLingui()
  // WPA Rulebook Section 4.2: the masked IBAN is how the payer tells their payment cards apart, one
  // per account.
  const maskedIban = card.credential.rawAttributes.masked_iban

  return (
    <YStack gap="2" flex={1}>
      <MiniCardRowItem
        name={card.credential.display.name ?? t(commonMessages.unknown)}
        backgroundImageUri={card.credential.display.backgroundImage?.url}
        backgroundColor={card.credential.display.backgroundColor ?? 'white'}
        issuerImageUri={card.credential.display.issuer.logo?.url}
        subtitle={card.credential.display.issuer.name ?? t(commonMessages.unknown)}
        artwork={artwork}
      />
      {(typeof maskedIban === 'string' || accessory) && (
        <XStack items="center" justify="space-between" gap="2">
          <Paragraph variant="sub" color="grey-700">
            {typeof maskedIban === 'string' ? maskedIban : ''}
          </Paragraph>
          {accessory}
        </XStack>
      )}
    </YStack>
  )
}
