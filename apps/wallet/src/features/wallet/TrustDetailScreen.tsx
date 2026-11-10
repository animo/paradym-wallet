import { Trans, useLingui } from '@lingui/react/macro'
import { BackFooter, useScrollViewPosition } from '@package/app'
import { commonMessages } from '@package/translations'
import {
  Circle,
  FlexPage,
  HeaderContainer,
  Heading,
  HeroIcons,
  Image,
  InfoButton,
  Paragraph,
  ScrollView,
  type ScrollViewRefType,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import type { PartyRegistration, TrustedEntity } from '@paradym/wallet-sdk'
import { useRef } from 'react'
import { Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type TrustDetailScreenProps = {
  name?: string
  logo?: string
  trustedEntities: Array<TrustedEntity>
  isDemoTrustedEntity?: boolean
  registration?: Omit<PartyRegistration, 'purpose'>
}

// The screen is reachable through a deep link, so only web pages and email addresses open
const isSafeLink = (url: string | undefined): url is string => !!url?.match(/^(https:\/\/|mailto:)/)

// Where a link goes: the host of a web page, or the email address
const getLinkTarget = (url: string) => url.replace(/^(https:\/\/|mailto:)/, '').split('/')[0]

export function TrustDetailScreen({
  name,
  logo,
  trustedEntities = [],
  isDemoTrustedEntity = false,
  registration,
}: TrustDetailScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const { t } = useLingui()

  const registrationLinks = [
    {
      title: t({
        id: 'trust.website',
        message: 'Website',
        comment: 'Link to the website of the organization, as it registered it',
      }),
      url: registration?.infoUri,
    },
    {
      title: t({
        id: 'trust.privacyPolicy',
        message: 'Privacy policy',
        comment: 'Link to the privacy policy of the organization, as it registered it',
      }),
      url: registration?.privacyPolicyUri,
    },
    {
      title: t({
        id: 'trust.support',
        message: 'Support',
        comment: 'Link to the support page or email address of the organization, as it registered it',
      }),
      url: registration?.supportUri,
    },
  ].filter((link): link is { title: string; url: string } => isSafeLink(link.url))

  return (
    <FlexPage gap="0" paddingHorizontal="0">
      <HeaderContainer
        title={t({
          id: 'trust.headerTitle',
          message: 'About this organization',
          comment: 'Screen title that describes information about a trusted party or organization',
        })}
        isScrolledByOffset={isScrolledByOffset}
      />

      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack px="5" gap="5" marginBottom={bottom}>
          <XStack gap="4" pt="2" items="center">
            <Circle
              overflow="hidden"
              items="center"
              justify="center"
              size="16"
              borderWidth={1}
              borderColor="grey-200"
              bg="grey-100"
            >
              {logo ? <Image src={logo} height="100%" width="100%" /> : <HeroIcons.BuildingOffice color="grey-700" />}
            </Circle>
            <YStack flex={1} gap="0-5">
              <Heading numberOfLines={3} heading="h2">
                {name || t(commonMessages.unknownOrganization)}
              </Heading>
              {isDemoTrustedEntity && <Paragraph variant="sub">{t(commonMessages.demoOrganization)}</Paragraph>}
            </YStack>
            {isDemoTrustedEntity ? (
              <HeroIcons.ExclamationTriangleFilled size={28} color="warning-500" />
            ) : (
              <HeroIcons.CheckCircleFilled size={28} color="positive-500" />
            )}
          </XStack>

          {trustedEntities.map((entity) => {
            const territoryMessage = entity.territory
              ? commonMessages.trustedListTerritories[entity.territory]
              : undefined
            const territory = territoryMessage ? t(territoryMessage) : entity.territory

            return (
              <XStack
                key={entity.entityId}
                items="center"
                rounded="8"
                px="4"
                py="3"
                gap="3"
                borderWidth={1}
                borderColor="grey-100"
              >
                {/* Rounded like the app icon on the welcome screen, in proportion to its size */}
                {entity.logoUri && (
                  <Stack rounded="3" overflow="hidden">
                    <Image src={entity.logoUri} width={36} height={36} />
                  </Stack>
                )}
                <YStack flex={1} gap="0-5">
                  <Paragraph variant="sub">
                    <Trans
                      id="trust.approvedBy"
                      comment="Label above the name of the organization that approved this one"
                    >
                      Approved by
                    </Trans>
                  </Paragraph>
                  <Heading heading="sub1" numberOfLines={3}>
                    {entity.organizationName}
                  </Heading>
                  {territory ? (
                    <Paragraph variant="sub">
                      {t({
                        id: 'trust.onTrustedList',
                        message: `On the trusted list of ${territory}`,
                        comment:
                          'Shown under the organization that approved this one, with the country of the trusted list the approving organization is on',
                      })}
                    </Paragraph>
                  ) : entity.demo ? (
                    <Paragraph variant="sub">{t(commonMessages.demoOrganization)}</Paragraph>
                  ) : null}
                </YStack>
              </XStack>
            )
          })}

          {registrationLinks.length > 0 && (
            <YStack gap="2" pb="2">
              <Heading heading="sub2">
                <Trans
                  id="trust.registeredDetails"
                  comment="Subheading for the links an organization provided when it registered to use wallets"
                >
                  Registered details
                </Trans>
              </Heading>
              {registrationLinks.map(({ title, url }) => (
                <InfoButton
                  key={title}
                  noIcon
                  title={title}
                  description={getLinkTarget(url)}
                  routingType="external"
                  onPress={() => Linking.openURL(url)}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      <BackFooter />
    </FlexPage>
  )
}
