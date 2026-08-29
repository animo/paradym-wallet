// Deep imports throughout: the `@package/ui` barrel pulls in the whole kit, and this bundle is
// separate from the app's.
import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { XStack, YStack } from '@package/ui/base/Stacks'
import { InfoButton } from '@package/ui/components/InfoButton'
import { HeroIcons } from '@package/ui/content/Icon'
import { IconContainer } from '@package/ui/content/IconContainer'
import { Image } from '@package/ui/content/Image'
import type { RequestVerifier } from '@paradym/wallet-sdk/trust/verifier'
import { useState } from 'react'
import { Circle } from 'tamagui'

/**
 * Who is asking, and what the wallet knows about them.
 *
 * The app's `VerifyPartySlide` pushes the list of approving organizations onto its own screen. The
 * request UI has no navigation — it is a single sheet the OS put on top of the verifier's app — so
 * the same list expands in place instead.
 */
export function DcApiVerifierSection({ verifier, origin }: { verifier: RequestVerifier; origin?: string }) {
  const { t } = useLingui()
  const [areTrustedEntitiesVisible, setAreTrustedEntitiesVisible] = useState(false)

  const entityIsTrustAnchor = verifier.trustedEntities.some((entity) => entity.entityId === verifier.entityId)
  const isDemoTrustedEntity = verifier.trustedEntities.some((entity) => entity.demo)

  // The verifier itself is not one of its own approvals.
  const approvedBy = verifier.trustedEntities
    .filter((entity) => entity.entityId !== verifier.entityId)
    .map((entity) => ({ ...entity, demo: isDemoTrustedEntity ? true : entity.demo }))

  const isRecognized = approvedBy.length > 0 || entityIsTrustAnchor

  return (
    <YStack gap="$4">
      <YStack gap="$3" ai="center">
        {/* `$white`, not `$background`: the logo is the verifier's artwork, commonly dark on
            transparent, so this is a plate under it rather than a surface of ours to darken. */}
        <Circle size={72} bw="$0.5" borderColor="$grey-100" bg="$white" overflow="hidden">
          {verifier.logo?.url ? (
            <Image
              src={verifier.logo.url}
              alt={verifier.logo.altText}
              width="100%"
              height="100%"
              contentFit="contain"
            />
          ) : (
            <HeroIcons.BuildingOffice color="$grey-800" size={32} />
          )}
        </Circle>
        <YStack gap="$1">
          <Heading heading="h2" center numberOfLines={2}>
            {verifier.name ? (
              <Trans id="dcApi.verifier.trustHeading" comment="Heading above the organization asking for data">
                Do you trust {verifier.name}?
              </Trans>
            ) : (
              <Trans id="dcApi.verifier.notVerifiedHeading">Organization not verified</Trans>
            )}
          </Heading>
          <Paragraph variant="annotation" center>
            {verifier.hostName ?? origin ?? verifier.entityId}
          </Paragraph>
        </YStack>
      </YStack>

      <YStack gap="$2">
        <InfoButton
          variant={isRecognized ? (entityIsTrustAnchor ? 'positive' : 'info') : 'warning'}
          routingType="modal"
          title={
            isRecognized
              ? t({ id: 'dcApi.verifier.recognizedTitle', message: 'Recognized organization' })
              : t(commonMessages.unknownOrganization)
          }
          description={
            isRecognized
              ? approvedBy.length === 1
                ? t({ id: 'dcApi.verifier.approvedByOne', message: 'Approved by one organization' })
                : approvedBy.length > 1
                  ? t({
                      id: 'dcApi.verifier.approvedByMultiple',
                      message: `Approved by ${approvedBy.length} organizations`,
                    })
                  : undefined
              : t({ id: 'dcApi.verifier.notVerifiedDescription', message: 'Organization is not verified' })
          }
          onPress={() => setAreTrustedEntitiesVisible((isVisible) => !isVisible)}
        />

        {areTrustedEntitiesVisible &&
          (approvedBy.length > 0 ? (
            approvedBy.map((entity) => (
              <XStack key={entity.entityId} ai="center" br="$8" p="$3" gap="$3" bg="$grey-100">
                {entity.logoUri && (
                  <Circle overflow="hidden" size="$4" bg="$grey-50">
                    <Image src={entity.logoUri} height="100%" width="100%" />
                  </Circle>
                )}
                <YStack f={1} flexShrink={1}>
                  <Heading heading="h3" numberOfLines={2}>
                    {entity.organizationName}
                  </Heading>
                  {entity.demo && (
                    <Paragraph variant="sub">
                      <Trans id="dcApi.verifier.demoOrganization">Demo organization</Trans>
                    </Paragraph>
                  )}
                </YStack>
                <IconContainer
                  icon={
                    entity.demo ? (
                      <HeroIcons.ExclamationTriangleFilled size={26} color="$warning-500" />
                    ) : (
                      <HeroIcons.CheckCircleFilled size={26} color="$positive-500" />
                    )
                  }
                />
              </XStack>
            ))
          ) : (
            <Paragraph variant="annotation" px="$2">
              {verifier.name ? (
                <Trans id="dcApi.verifier.noApprovals">
                  No organization has approved {verifier.name}. Consider carefully whether you want to share with them.
                </Trans>
              ) : (
                <Trans id="dcApi.verifier.noApprovalsUnknown">
                  No organization has approved this one. Consider carefully whether you want to share with them.
                </Trans>
              )}
            </Paragraph>
          ))}

        {isDemoTrustedEntity && (
          <InfoButton
            variant="warning"
            title={t({ id: 'dcApi.verifier.demoTitle', message: 'Demo organization' })}
            description={t({ id: 'dcApi.verifier.demoDescription', message: 'Do not share real data' })}
          />
        )}
      </YStack>
    </YStack>
  )
}
