import { useLingui } from '@lingui/react/macro'
import { commonMessages, supportedLanguageNames, useLocale } from '@package/translations'
import { Button, Circle, Heading, HeroIcons, Paragraph, ScrollView, YStack } from '@package/ui'
import type { PasoRefusalCode, PasoRefusalDetail } from '@paradym/wallet-sdk'
import { usePasoRefusalMessage } from '../pasoRefusalMessage'

export interface PasoRefusal {
  code: PasoRefusalCode
  detail?: PasoRefusalDetail
}

/**
 * Where PaSO tells the wallet to "cease processing and inform the user": a full stop in the wallet's
 * own words, one reason, and a single Close. Nothing the issuer or the Relying Party wrote is shown,
 * since what failed is exactly whether that can be shown safely.
 */
export function PasoRefusalSlide({
  refusal,
  verifierName,
  onClose,
}: {
  refusal: PasoRefusal
  verifierName?: string
  onClose: () => void
}) {
  const { t } = useLingui()
  const locale = useLocale()
  const refusalMessage = usePasoRefusalMessage()
  const requester = verifierName ?? t(commonMessages.unknownOrganization)

  const content =
    refusal.code === 'noMatchingCard'
      ? {
          title: t({
            id: 'paso.refusal.noCard.title',
            message: 'No matching payment card',
            comment: 'Title when no card in the wallet can authorize a payment request',
          }),
          description: t({
            id: 'paso.refusal.noCard.description',
            message: `${requester} asked for a payment, but there is no matching payment card in your wallet.`,
            comment: 'Explains that no card in the wallet can authorize the payment',
          }),
          boxLabel: t({
            id: 'paso.refusal.noCard.whatYouCanDo',
            message: 'What you can do',
            comment: 'Label above advice on how to get a payment card',
          }),
          boxValue: t({
            id: 'paso.refusal.noCard.advice',
            message: "Add your bank's payment card from your banking app, then try the payment again.",
            comment: 'Advice when no card in the wallet can authorize a payment',
          }),
        }
      : refusal.code === 'noSupportedLocale'
        ? {
            title: t({
              id: 'paso.refusal.noLanguage.title',
              message: "This payment isn't available in your language",
              comment: 'Title when a payment request has no text in a language the user has set',
            }),
            description: t({
              id: 'paso.refusal.noLanguage.description',
              message:
                "The payment request has no text in a language set in your wallet. The wallet won't guess or translate payment details, so your card can't be used for it.",
              comment: 'Explains why a payment in an unsupported language cannot be authorized',
            }),
            boxLabel: t({
              id: 'paso.refusal.noLanguage.walletLanguage',
              message: 'Your wallet language',
              comment: 'Label above the language the wallet is set to',
            }),
            boxValue: supportedLanguageNames[locale] ?? locale,
          }
        : refusal.detail ||
            refusal.code === 'metadataViolatesConstraints' ||
            refusal.code === 'externalResourceVerificationFailed'
          ? {
              title: t({
                id: 'paso.refusal.cannotShow.title',
                message: "This payment can't be shown safely",
                comment: 'Title when a payment request cannot be displayed completely and exactly',
              }),
              description: t({
                id: 'paso.refusal.cannotShow.description',
                message: `${requester} sent a payment request that this wallet can't display completely and exactly. To protect you, it can't be confirmed.`,
                comment: 'Explains that a payment that cannot be displayed exactly cannot be confirmed',
              }),
              boxLabel: t({ id: 'paso.refusal.reason', message: 'Reason', comment: 'Label above the refusal reason' }),
              boxValue: detailMessage(refusal.detail, t) ?? refusalMessage(refusal.code),
            }
          : {
              title: t({
                id: 'paso.refusal.generic.title',
                message: "This payment can't be authorized",
                comment: 'Title when a payment request is refused',
              }),
              description: refusalMessage(refusal.code),
            }

  return (
    <YStack grow={1} justify="space-between">
      <ScrollView>
        <YStack gap="4" pt="5">
          <Circle size={64} bg="grey-50" borderWidth={1} borderColor="grey-100">
            <HeroIcons.ShieldExclamation size={30} color="grey-600" />
          </Circle>
          <Heading>{content.title}</Heading>
          <Paragraph>{content.description}</Paragraph>
          {'boxLabel' in content && (
            <YStack p="4" gap="1" rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-100">
              <Paragraph variant="annotation">{content.boxLabel}</Paragraph>
              <Paragraph color="grey-900" fontWeight="medium">
                {content.boxValue}
              </Paragraph>
            </YStack>
          )}
          <Paragraph variant="sub">
            {t({
              id: 'paso.refusal.nothingShared',
              message: 'Nothing has been paid or shared.',
              comment: 'Reassurance shown when a payment request was refused',
            })}
          </Paragraph>
        </YStack>
      </ScrollView>
      <YStack borderTopWidth="1" borderColor="grey-200" pt="3" mx="-5" px="5">
        <Button.Solid onPress={onClose}>{t(commonMessages.close)}</Button.Solid>
      </YStack>
    </YStack>
  )
}

function detailMessage(detail: PasoRefusalDetail | undefined, t: ReturnType<typeof useLingui>['t']) {
  switch (detail) {
    case 'labelTooLong':
      return t({
        id: 'paso.refusal.detail.labelTooLong',
        message: 'Some text in this request is too long to show in full.',
        comment: 'Refusal reason: a label of a payment request cannot be shown in full',
      })
    case 'directionalCharacters':
      return t({
        id: 'paso.refusal.detail.directionalCharacters',
        message: 'This request contains hidden characters that could change how its text reads.',
        comment: 'Refusal reason: a payment request contains text direction override characters',
      })
    case 'imageNotVerified':
      return t({
        id: 'paso.refusal.detail.imageNotVerified',
        message: 'An image in this request could not be checked.',
        comment: 'Refusal reason: an image in a payment request failed its integrity check',
      })
    case 'unsupportedValueType':
      return t({
        id: 'paso.refusal.detail.unsupportedValueType',
        message: "This request contains a detail the wallet can't display.",
        comment: 'Refusal reason: a payment request contains a value of a type the wallet cannot display',
      })
    default:
      return undefined
  }
}
