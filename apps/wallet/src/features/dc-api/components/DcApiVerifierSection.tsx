// Deep imports throughout: the `@package/ui` barrel pulls in the whole kit, and this bundle is
// separate from the app's.
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { XStack, YStack } from '@package/ui/base/Stacks'
import { HeroIcons } from '@package/ui/content/Icon'
import { Image } from '@package/ui/content/Image'
import type { RequestVerifier } from '@paradym/wallet-sdk/trust/verifier'
import { Circle } from 'tamagui'
import { dcApiMessages as messages } from '../messages'

/**
 * Who is asking, and whether the wallet recognizes them. One row, without the list of approving
 * organizations the app shows: the request UI is a small sheet over the verifier's app.
 */
export function DcApiVerifierSection({
  verifier,
  origin,
  isPayment,
}: {
  verifier: RequestVerifier
  origin?: string
  /** Whether the request asks to authorize a payment, which the heading says instead of asking for data. */
  isPayment: boolean
}) {
  const { t } = useLingui()

  const entityIsTrustAnchor = verifier.trustedEntities.some((entity) => entity.entityId === verifier.entityId)
  const isDemoTrustedEntity = verifier.trustedEntities.some((entity) => entity.demo)

  // The verifier itself is not one of its own approvals.
  const isApprovedByOthers = verifier.trustedEntities.some((entity) => entity.entityId !== verifier.entityId)
  const isRecognized = isApprovedByOthers || entityIsTrustAnchor
  const isOverAsking = verifier.overAsking?.valid === false

  // Recognized or not fits on one line under the host. A demo organization gets its own box below: it
  // outranks recognition, since it says not to share real data. Over-asking does too, and only a
  // recognized organization is checked for it.
  const trust = isRecognized
    ? {
        icon: <HeroIcons.CheckCircleFilled size={16} color="positive-500" />,
        label: t(commonMessages.recognizedOrganization),
      }
    : {
        icon: <HeroIcons.ExclamationTriangleFilled size={16} color="warning-500" />,
        label: t(commonMessages.unknownOrganization),
      }

  return (
    <YStack gap="3">
      <XStack gap="3" items="center">
        {/* `white`, not `background`: the logo is the verifier's artwork, commonly dark on
            transparent, so this is a plate under it rather than a surface of ours to darken. */}
        <Circle size={48} borderWidth="1" borderColor="grey-100" bg="white" overflow="hidden">
          {verifier.logo?.url ? (
            <Image
              src={verifier.logo.url}
              alt={verifier.logo.altText}
              width="100%"
              height="100%"
              contentFit="contain"
            />
          ) : (
            <HeroIcons.BuildingOffice color="grey-800" size={24} />
          )}
        </Circle>
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
          <Paragraph variant="annotation" numberOfLines={1}>
            {verifier.hostName ?? origin ?? verifier.entityId}
          </Paragraph>
          {!isDemoTrustedEntity && !isOverAsking && (
            <XStack gap="0-5" items="center">
              {trust.icon}
              <Paragraph variant="annotation" flex={1}>
                {trust.label}
              </Paragraph>
            </XStack>
          )}
        </YStack>
      </XStack>

      {isOverAsking && (
        <WarningBox
          variant="danger"
          title={t(commonMessages.overAsking)}
          message={
            verifier.name
              ? t(commonMessages.overAskingWarning(verifier.name))
              : t(commonMessages.overAskingWarningUnknownOrganization)
          }
        />
      )}
      {isDemoTrustedEntity && (
        <WarningBox
          variant="warning"
          title={t(commonMessages.demoOrganization)}
          message={t(commonMessages.demoOrganizationWarning)}
        />
      )}
    </YStack>
  )
}

function WarningBox({ variant, title, message }: { variant: 'warning' | 'danger'; title: string; message: string }) {
  return (
    <XStack
      rounded="6"
      bg={variant === 'danger' ? 'danger-300' : 'warning-300'}
      borderWidth={1}
      borderColor={variant === 'danger' ? 'danger-400' : 'warning-400'}
      gap="3"
      p="4"
      items="center"
    >
      <HeroIcons.ExclamationTriangleFilled size={20} color={variant === 'danger' ? 'danger-600' : 'warning-600'} />
      <YStack flex={1}>
        <Paragraph variant="sub" fontWeight="semiBold" color="grey-900">
          {title}
        </Paragraph>
        <Paragraph variant="annotation" color="grey-800">
          {message}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
