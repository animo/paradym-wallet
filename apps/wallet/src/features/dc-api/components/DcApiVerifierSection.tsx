// Deep imports throughout: the `@package/ui` barrel pulls in the whole kit, and this bundle is
// separate from the app's.
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { XStack, YStack } from '@package/ui/base/Stacks'
import { InfoButton } from '@package/ui/components/InfoButton'
import { HeroIcons } from '@package/ui/content/Icon'
import { Image } from '@package/ui/content/Image'
import type { RequestVerifier } from '@paradym/wallet-sdk/trust/verifier'
import { Circle } from 'tamagui'
import { dcApiMessages as messages } from '../messages'

/**
 * Who is asking, and whether the wallet recognizes them, in one card. Without the list of approving
 * organizations the app shows, which the card opens for a recognized organization: the request UI is a
 * small sheet over the verifier's app.
 */
export function DcApiVerifierSection({
  verifier,
  origin,
  isPayment,
  onShowDetails,
}: {
  verifier: RequestVerifier
  origin?: string
  /** Whether the request asks to authorize a payment, which the heading says instead of asking for data. */
  isPayment: boolean
  /** Shows who approved a recognized organization, as the app's trust screen does. */
  onShowDetails: () => void
}) {
  const { t } = useLingui()

  const entityIsTrustAnchor = verifier.trustedEntities.some((entity) => entity.entityId === verifier.entityId)
  const isDemoTrustedEntity = verifier.trustedEntities.some((entity) => entity.demo)

  // The verifier itself is not one of its own approvals.
  const isApprovedByOthers = verifier.trustedEntities.some((entity) => entity.entityId !== verifier.entityId)
  const isRecognized = isApprovedByOthers || entityIsTrustAnchor
  const isOverAsking = verifier.overAsking?.valid === false

  return (
    // Extra room below: who is asking is what the rest of the sheet is read against
    <YStack gap="3" mb="3">
      <YStack
        bg="surface"
        rounded="8"
        borderWidth="1"
        borderColor="grey-100"
        shadow="card"
        px="4"
        py="3"
        onPress={isRecognized ? onShowDetails : undefined}
        role={isRecognized ? 'button' : undefined}
        opacity={isRecognized ? '1 press:0.7' : undefined}
      >
        <XStack gap="3" items="center">
          {/* `white`, not `background`: the logo is the verifier's artwork, commonly dark on
              transparent, so this is a plate under it rather than a surface of ours to darken. Without
              a logo there's nothing to show, so the name takes the room. */}
          {verifier.logo?.url ? (
            <Circle size={44} borderWidth="1" borderColor="grey-100" bg="white" overflow="hidden">
              <Image
                src={verifier.logo.url}
                alt={verifier.logo.altText}
                width="100%"
                height="100%"
                contentFit="contain"
              />
            </Circle>
          ) : null}
          <YStack flex={1} gap="0-5">
            {/* The action, short enough for one line. A payment leaves the name out: the payee is right
                below, and may be someone other than the organization that asks. */}
            <Heading heading="h3" numberOfLines={2}>
              {isPayment
                ? t(messages.confirmPayment)
                : verifier.name
                  ? t(messages.shareWith(verifier.name))
                  : t(messages.dataRequest)}
            </Heading>
            {/* Without the scheme, which leaves the host itself more room */}
            <Paragraph variant="annotation" numberOfLines={1}>
              {(verifier.hostName ?? origin ?? verifier.entityId).replace(/^https:\/\//, '')}
            </Paragraph>
            {isDemoTrustedEntity ? (
              <Paragraph variant="annotation">{t(commonMessages.demoOrganization)}</Paragraph>
            ) : !isRecognized ? (
              <Paragraph variant="annotation">{t(commonMessages.unknownOrganization)}</Paragraph>
            ) : null}
          </YStack>
          {/* As on the trust screen: a check for a recognized organization, else a warning */}
          {isRecognized && !isDemoTrustedEntity ? (
            <HeroIcons.CheckCircleFilled size={24} color="positive-500" />
          ) : (
            <HeroIcons.ExclamationTriangleFilled size={24} color="warning-500" />
          )}
          {isRecognized && <HeroIcons.ChevronRight size={16} color="grey-500" />}
        </XStack>
      </YStack>

      {isOverAsking && (
        <InfoButton
          variant="danger"
          title={t(commonMessages.overAsking)}
          description={
            verifier.name
              ? t(commonMessages.overAskingWarning(verifier.name))
              : t(commonMessages.overAskingWarningUnknownOrganization)
          }
        />
      )}
    </YStack>
  )
}
