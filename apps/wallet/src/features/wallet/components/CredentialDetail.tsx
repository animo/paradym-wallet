import { Trans, useLingui } from '@lingui/react/macro'
import { DeleteCredentialSheet, useHaptics } from '@package/app'
import { CardInfoLifecycle, CredentialCard } from '@package/app/components'
import { useHeaderRightAction, useScrollViewPosition } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import { AnimatedStack, Heading, HeroIcons, InfoButton, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import type { CredentialForDisplay } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface CredentialDetailProps {
  credential: CredentialForDisplay
  // Called once the card is deleted. Goes back by default.
  onDeleted?: () => void
  // Hidden when the attributes are shown next to the card
  showAttributesLink?: boolean
  // Off when the screen shows the delete action itself
  showDeleteAction?: boolean
}

export function CredentialDetail({
  credential,
  onDeleted,
  showAttributesLink = true,
  showDeleteAction = true,
}: CredentialDetailProps) {
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { withHaptics } = useHaptics()
  const { t } = useLingui()

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const canDelete = credential.category?.canDeleteCredential ?? true
  const openDeleteSheet = withHaptics(() => setIsSheetOpen(true))

  const onCardAttributesPress = withHaptics(() => {
    router.push(`/credentials/${credential.id}/attributes`)
  })

  return (
    <>
      {showDeleteAction && <HeaderDeleteAction onPress={openDeleteSheet} renderCondition={canDelete} />}
      <YStack
        w="100%"
        top={0}
        p="4"
        borderBottomWidth="0-5"
        borderColor={isScrolledByOffset ? 'grey-200' : 'background'}
      />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack ai="center" gap="6" p="4" marginBottom={bottom}>
          <AnimatedStack width="100%" mt="-3" mb="-5" scale={0.75}>
            <CredentialCard
              issuerImage={{
                url: credential.display.issuer.logo?.url,
                altText: credential.display.issuer.logo?.altText,
              }}
              textColor={credential.display.textColor}
              name={credential.display.name}
              backgroundImage={{
                url: credential.display.backgroundImage?.url,
                altText: credential.display.backgroundImage?.altText,
              }}
              bgColor={credential.display.backgroundColor ?? 'grey-900'}
            />
          </AnimatedStack>
          <Stack gap="2">
            <Heading ta="center" heading="h1">
              <Trans id="credentials.detailsTitle" comment="Title of the credential details screen">
                Card details
              </Trans>
            </Heading>
            <Paragraph numberOfLines={2} ta="center">
              <Trans id="common.issuedBy" comment="Prefix before issuer name">
                Issued by {credential.display.issuer.name}.
              </Trans>
            </Paragraph>
          </Stack>
          <YStack w="100%" gap="2">
            <CardInfoLifecycle
              validFrom={credential.metadata.validFrom ? new Date(credential.metadata.validFrom) : undefined}
              validUntil={credential.metadata.validUntil ? new Date(credential.metadata.validUntil) : undefined}
              hasRefreshToken={credential.hasRefreshToken}
            />
            {showAttributesLink && (
              <InfoButton
                variant="view"
                title={t({
                  id: 'credentials.cardAttributes',
                  message: 'Card attributes',
                  comment: 'Label for button that shows detailed card attributes',
                })}
                description={t({
                  id: 'credentials.cardAttributesDescription',
                  message: 'View attributes of the card',
                  comment: 'Description text for the attributes button',
                })}
                onPress={onCardAttributesPress}
              />
            )}
          </YStack>
        </YStack>
      </ScrollView>
      <DeleteCredentialSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        id={credential.id}
        name={credential.display.name ?? t(commonMessages.unknown)}
        onDone={onDeleted}
      />
    </>
  )
}

function HeaderDeleteAction({ onPress, renderCondition }: { onPress: () => void; renderCondition: boolean }) {
  useHeaderRightAction({ icon: <HeroIcons.Trash />, onPress, renderCondition })

  return null
}
