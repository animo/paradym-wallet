import { useDevelopmentMode } from '@easypid/hooks'
import { Trans, useLingui } from '@lingui/react/macro'
import type { TrustedEntity, TrustMechanism } from '@package/agent'
import { TextBackButton, useScrollViewPosition } from '@package/app'
import { commonMessages } from '@package/translations'
import {
  Circle,
  FlexPage,
  HeaderContainer,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  MessageBox,
  Paragraph,
  ScrollView,
  type ScrollViewRefType,
  XStack,
  YStack,
} from '@package/ui'
import { useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type FunkeTrustDetailScreenProps = {
  trustMechanism: TrustMechanism
  name?: string
  logo?: string
  trustedEntities: Array<TrustedEntity>
  isDemoTrustedEntity?: boolean
}

export function FunkeTrustDetailScreen({
  trustMechanism,
  name,
  logo,
  trustedEntities = [],
  isDemoTrustedEntity = false,
}: FunkeTrustDetailScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const { t } = useLingui()

  const trustMechanismName =
    trustMechanism === 'eudi_rp_authentication'
      ? 'EU Trusted List'
      : trustMechanism === 'openid_federation'
        ? 'OpenID Federation'
        : trustMechanism === 'did'
          ? 'Decentralized Identifier'
          : trustMechanism === 'x509'
            ? 'X.509 Certificate'
            : 'No signature'

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer
        title={t({
          id: 'trust.headerTitle',
          message: 'About this organization',
          comment: 'Screen title that describes information about a trusted party or organization',
        })}
        isScrolledByOffset={isScrolledByOffset}
      />

      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack px="$4" gap="$4" marginBottom={bottom}>
          <MessageBox
            variant="light"
            message={t({
              id: 'trust.warning',
              message: 'Always consider whether sharing with an organization is wise.',
              comment: 'Shown as a warning box when viewing a trusted party’s detail',
            })}
            icon={<HeroIcons.ExclamationTriangleFilled />}
          />

          <XStack gap="$4" pt="$2" ai="center">
            {logo ? (
              <Circle overflow="hidden" ai="center" jc="center" size="$6" bw={1} borderColor="$grey-200" bg="$grey-100">
                <Image src={logo} height="100%" width="100%" />
              </Circle>
            ) : (
              <Circle overflow="hidden" ai="center" jc="center" size="$6" bw={1} borderColor="$grey-200" bg="$grey-100">
                <HeroIcons.BuildingOffice color="$grey-700" />
              </Circle>
            )}
            <Heading flex={1} numberOfLines={3} heading="h2">
              {name || t(commonMessages.unknownOrganization)}{' '}
              {isDemoTrustedEntity ? (
                <Trans id="trust.demo" comment="Label shown after an organization name if it is a demo version">
                  (Demo)
                </Trans>
              ) : null}
            </Heading>
          </XStack>

          <YStack gap="$4" py="$2">
            <YStack gap="$2">
              <Heading heading="sub2">
                <Trans id="trust.trustedBy" comment="Subheading for list of organizations that trust the current one">
                  Trusted by
                </Trans>{' '}
                {isDevelopmentModeEnabled && <Paragraph>({trustMechanismName})</Paragraph>}
              </Heading>
              <Paragraph>
                {trustedEntities.length > 0
                  ? name
                    ? t({
                        id: 'trust.approvedList',
                        comment: 'A sentence that introduces a list of organizations that approved the current party',
                        message: `A list of organizations that have approved ${name}.`,
                      })
                    : t({
                        id: 'trust.approvedListWithoutOrganizationName',
                        comment:
                          'A sentence that introduces a list of organizations that approved the current party, but the organization name is not known',
                        message: 'A list of organizations that have approved this unknown organization.',
                      })
                  : name
                    ? t({
                        id: 'trust.noApprovals',
                        comment: 'A message shown when there are no organizations that approved the current party',
                        message: `There are no organizations that have approved ${name}.`,
                      })
                    : t({
                        id: 'trust.noApprovalsWithoutOrganizationName',
                        comment:
                          'A message shown when there are no organizations that approved the current party, but the organization name is not known',
                        message: 'There are no organizations that have approved this unknown organization.',
                      })}
              </Paragraph>
            </YStack>

            <YStack gap="$2">
              {trustedEntities.map((entity) => (
                <XStack ai="center" key={entity.entityId} br="$8" p="$3.5" gap="$3" bg="$grey-100">
                  {entity.logoUri && (
                    <Circle overflow="hidden" size="$4" bg="$grey-50">
                      <Image src={entity.logoUri} height="100%" width="100%" />
                    </Circle>
                  )}
                  <XStack gap="$2" display="flex" f={1} justifyContent="space-between" ai="center">
                    <YStack flexShrink={1}>
                      <Heading heading="h3" numberOfLines={3} textOverflow="ellipsis">
                        {entity.organizationName}
                      </Heading>
                      {entity.demo && (
                        <Paragraph variant="sub">
                          <Trans
                            id="trust.demoOrg"
                            comment="Shown under the name of an organization to indicate that it is a demo"
                          >
                            Demo organization
                          </Trans>
                        </Paragraph>
                      )}
                    </YStack>
                    <IconContainer
                      icon={
                        entity.demo ? (
                          <HeroIcons.ExclamationTriangleFilled size={30} color="$warning-500" />
                        ) : (
                          <HeroIcons.CheckCircleFilled size={30} color="$positive-500" />
                        )
                      }
                    />
                  </XStack>
                </XStack>
              ))}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>

      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
