import { Trans, useLingui } from '@lingui/react/macro'
import {
  DeleteDeferredCredentialSheet,
  FunkeCredentialCard,
  TextBackButton,
  useHaptics,
  useHeaderRightAction,
  useScrollViewPosition,
} from '@package/app'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  FlexPage,
  Heading,
  HeroIcons,
  InfoButton,
  Loader,
  Paragraph,
  ScrollView,
  Stack,
  YStack,
} from '@package/ui'
import {
  extractOpenId4VcCredentialMetadata,
  getCredentialDisplayWithDefaults,
  getDeferredCredentialNextCheckAt,
  getOpenId4VcCredentialDisplay,
  useDeferredCredentials,
} from '@paradym/wallet-sdk'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Query = { deferredCredentialId: string }

export function DeferredCredentialNotificationScreen() {
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { i18n, t } = useLingui()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { withHaptics } = useHaptics()

  const { deferredCredentialId } = useLocalSearchParams<Query>()
  const { deferredCredentials, isLoading } = useDeferredCredentials()
  const deferredCredential = deferredCredentials?.find((dc) => dc.id === deferredCredentialId)
  const nextCheck = deferredCredential ? getDeferredCredentialNextCheckAt(deferredCredential) : undefined

  useEffect(() => {
    if (!isLoading && !deferredCredential) {
      router.back()
    }
  }, [router, isLoading, deferredCredential])

  useHeaderRightAction({
    icon: <HeroIcons.Trash />,
    onPress: withHaptics(() => setIsSheetOpen(true)),
    renderCondition: true,
  })

  const credentialDisplay = deferredCredential
    ? getCredentialDisplayWithDefaults(
        getOpenId4VcCredentialDisplay(
          extractOpenId4VcCredentialMetadata(deferredCredential.response.credentialConfiguration, {
            display: deferredCredential.issuerMetadata.credentialIssuer?.display,
            id: deferredCredential.issuerMetadata.credentialIssuer?.credential_issuer,
          })
        )
      )
    : undefined

  return deferredCredential && credentialDisplay ? (
    <>
      <FlexPage p={0} gap={0}>
        <YStack
          w="100%"
          top={0}
          p="$4"
          borderBottomWidth="$0.5"
          borderColor={isScrolledByOffset ? '$grey-200' : '$background'}
        />
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
          <YStack ai="center" gap="$6" p="$4" marginBottom={bottom}>
            <AnimatedStack width="100%" mt="$-3" mb="$-5" scale={0.75}>
              <FunkeCredentialCard
                issuerImage={{
                  url: credentialDisplay.issuer.logo?.url,
                  altText: credentialDisplay.issuer.logo?.altText,
                }}
                textColor={credentialDisplay.textColor}
                name={credentialDisplay.name}
                backgroundImage={{
                  url: credentialDisplay.backgroundImage?.url,
                  altText: credentialDisplay.backgroundImage?.altText,
                }}
                isLoading={true}
                bgColor={credentialDisplay.backgroundColor ?? '$grey-900'}
              />
            </AnimatedStack>
            <Stack gap="$2">
              <Heading ta="center" heading="h1">
                <Trans id="deferredCredentials.title" comment="Title of the pending credential notification screen">
                  Pending card
                </Trans>
              </Heading>
              <Paragraph numberOfLines={2} ta="center">
                <Trans id="common.issuedBy" comment="Prefix before issuer name">
                  Issued by {credentialDisplay.issuer.name}.
                </Trans>
              </Paragraph>
            </Stack>
            <YStack w="100%" gap="$2">
              {deferredCredential.lastErroredAt && (
                <InfoButton
                  variant="danger"
                  title={t({
                    id: 'deferredCredentials.failedToRetrieveCard',
                    message: 'Failed to retrieve card',
                    comment: 'Title of the error box explaining pending credentials',
                  })}
                  description={t({
                    id: 'deferredCredentials.failedToRetrieveCardDescription',
                    message: 'An error occurred while retrieving the card from the issuer.',
                    comment: 'Description of the error box explaining pending credentials',
                  })}
                />
              )}
              {nextCheck ? (
                nextCheck.toDateString() === new Date().toDateString() ? (
                  <InfoButton
                    variant="info"
                    title={t({
                      id: 'deferredCredentials.cardNotAvailableYet',
                      message: 'Card not available yet',
                      comment: 'Title of the info box explaining that the credential is not available yet',
                    })}
                    description={t({
                      id: 'deferredCredentials.cardNotAvailableYetWithTimeDescription',
                      message: `The issuer of the card indicated you should check again at ${i18n.date(nextCheck, {
                        hour: 'numeric',
                        minute: 'numeric',
                      })}.`,
                      comment: 'Description of the info box explaining the card is pending with expected time',
                    })}
                  />
                ) : (
                  <InfoButton
                    variant="info"
                    title={t({
                      id: 'deferredCredentials.cardNotAvailableYet',
                      message: 'Card not available yet',
                      comment: 'Title of the info box explaining that the credential is not available yet',
                    })}
                    description={t({
                      id: 'deferredCredentials.cardNotAvailableYetWithDateDescription',
                      message: `The issuer of the card indicated you should check again on ${i18n.date(nextCheck, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}.`,
                      comment: 'Description of the info box explaining the card is pending with expected date',
                    })}
                  />
                )
              ) : (
                <InfoButton
                  variant="info"
                  title={t({
                    id: 'deferredCredentials.cardNotAvailableYet',
                    message: 'Card not available yet',
                    comment: 'Title of the info box explaining that the credential is not available yet',
                  })}
                  description={t({
                    id: 'deferredCredentials.cardNotAvailableYetDescription',
                    message: 'The issuer has not yet made the card available. Please check again later.',
                    comment: 'Description of the info box explaining the card is pending',
                  })}
                />
              )}
            </YStack>
          </YStack>
        </ScrollView>
        <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
          <TextBackButton />
        </YStack>
      </FlexPage>
      <DeleteDeferredCredentialSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        id={deferredCredential.id}
        name={credentialDisplay.name ?? t(commonMessages.unknown)}
        hasErrors={!!deferredCredential.lastErroredAt}
        issuerDisplay={credentialDisplay.issuer}
        issuerId={deferredCredential.issuerMetadata?.credentialIssuer?.credential_issuer}
      />
    </>
  ) : (
    <Loader />
  )
}
