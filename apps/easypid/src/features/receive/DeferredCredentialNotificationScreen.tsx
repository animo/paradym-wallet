import { Trans, useLingui } from '@lingui/react/macro'
import {
  extractOpenId4VcCredentialMetadata,
  getCredentialDisplayWithDefaults,
  getDeferredCredentialNextCheckAt,
  getOpenId4VcCredentialDisplay,
  useDeferredCredentials,
} from '@package/agent'
import {
  DeleteDeferredCredentialSheet,
  FunkeCredentialCard,
  TextBackButton,
  useHaptics,
  useHeaderRightAction,
  useScrollViewPosition,
} from '@package/app'
import {
  AnimatedStack,
  FlexPage,
  Heading,
  HeroIcons,
  InfoButton,
  Paragraph,
  ScrollView,
  Stack,
  YStack,
} from '@package/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Query = { deferredCredentialId: string }

export function DeferredCredentialNotificationScreen() {
  const router = useRouter()
  const { withHaptics } = useHaptics()
  const { bottom } = useSafeAreaInsets()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { i18n, t } = useLingui()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { deferredCredentialId } = useLocalSearchParams<Query>()
  const { deferredCredentials } = useDeferredCredentials()

  const deferredCredential = deferredCredentials?.find((dc) => dc.id === deferredCredentialId)
  if (!deferredCredential) {
    router.back()
    return
  }

  const { response, issuerMetadata } = deferredCredential
  const nextCheck = getDeferredCredentialNextCheckAt(deferredCredential)

  useHeaderRightAction({
    icon: <HeroIcons.Trash />,
    onPress: withHaptics(() => setIsSheetOpen(true)),
    renderCondition: true,
  })

  const credentialDisplay = getCredentialDisplayWithDefaults(
    getOpenId4VcCredentialDisplay(
      extractOpenId4VcCredentialMetadata(response.credentialConfiguration, {
        display: issuerMetadata.credentialIssuer?.display,
        id: issuerMetadata.credentialIssuer?.credential_issuer,
      })
    )
  )

  return (
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
                <Trans id="deferredCredentials.title" comment="Title of the deferred credential notification screen">
                  Deferred credential
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
                    comment: 'Title of the error box explaining deferred credentials',
                  })}
                  description={t({
                    id: 'deferredCredentials.failedToRetrieveCardDescription',
                    message: 'An error occurred while retrieving the deferred card from the issuer.',
                    comment: 'Description of the error box explaining deferred credentials',
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
                      comment: 'Title of the info box explaining deferred credentials',
                    })}
                    description={t({
                      id: 'deferredCredentials.cardNotAvailableYetWithTimeDescription',
                      message: `The issuer of the card indicated you should check again at ${i18n.date(nextCheck, {
                        hour: 'numeric',
                        minute: 'numeric',
                      })}.`,
                      comment: 'Description of the info box explaining deferred credentials with time',
                    })}
                  />
                ) : (
                  <InfoButton
                    variant="info"
                    title={t({
                      id: 'deferredCredentials.cardNotAvailableYet',
                      message: 'Card not available yet',
                      comment: 'Title of the info box explaining deferred credentials',
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
                      comment: 'Description of the info box explaining deferred credentials with date',
                    })}
                  />
                )
              ) : (
                <InfoButton
                  variant="info"
                  title={t({
                    id: 'deferredCredentials.cardNotAvailableYet',
                    message: 'Card not available yet',
                    comment: 'Title of the info box explaining deferred credentials',
                  })}
                  description={t({
                    id: 'deferredCredentials.cardNotAvailableYetDescription',
                    message: 'The issuer has not yet made the card available. Please check again later.',
                    comment: 'Description of the info box explaining deferred credentials',
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
        name={credentialDisplay.name}
        hasErrors={!!deferredCredential.lastErroredAt}
        issuerDisplay={credentialDisplay.issuer}
        issuerId={issuerMetadata?.credentialIssuer?.credential_issuer}
      />
    </>
  )
}
