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
  useToastController,
} from '@package/ui'
import React, { useState } from 'react'

import { useHeaderRightAction, useScrollViewPosition } from '@package/app/src/hooks'
import { DeleteCredentialSheet, TextBackButton } from 'packages/app'

import { type CredentialForDisplayId, useCredentialForDisplayById } from '@package/agent'
import { useRouter } from 'expo-router'
import { useHaptics } from 'packages/app'
import { CardInfoLifecycle, FunkeCredentialCard } from 'packages/app/src/components'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createParam } from 'solito'

const { useParams } = createParam<{ id: CredentialForDisplayId }>()

export function FunkeCredentialDetailScreen() {
  const toast = useToastController()
  const { params } = useParams()
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { withHaptics } = useHaptics()

  const { credential } = useCredentialForDisplayById(params.id)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useHeaderRightAction({
    icon: <HeroIcons.Trash />,
    onPress: withHaptics(() => setIsSheetOpen(true)),
    renderCondition: credential?.category?.canDeleteCredential ?? true,
  })

  if (!credential) {
    toast.show('Credential not found', {
      customData: {
        preset: 'danger',
      },
    })
    router.back()
    return
  }

  const onCardAttributesPress = withHaptics(() => {
    router.push(`/credentials/${params.id}/attributes`)
  })

  return (
    <>
      <FlexPage gap="$0" paddingHorizontal="$0">
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
                  url: credential.display.issuer.logo?.url,
                  altText: credential.display.issuer.logo?.altText,
                }}
                textColor={credential.display.textColor}
                name={credential.display.name}
                backgroundImage={{
                  url: credential.display.backgroundImage?.url,
                  altText: credential.display.backgroundImage?.altText,
                }}
                bgColor={credential.display.backgroundColor ?? '$grey-900'}
              />
            </AnimatedStack>
            <Stack gap="$2">
              <Heading ta="center" variant="h1">
                Card details
              </Heading>
              <Paragraph numberOfLines={2} ta="center">
                Issued by {credential.display.issuer.name}.
              </Paragraph>
            </Stack>
            <YStack w="100%" gap="$2">
              <CardInfoLifecycle
                validFrom={credential.metadata.validFrom ? new Date(credential.metadata.validFrom) : undefined}
                validUntil={credential.metadata.validUntil ? new Date(credential.metadata.validUntil) : undefined}
                hasRefreshToken={credential.hasRefreshToken}
              />
              <InfoButton
                variant="view"
                title="Card attributes"
                description="View attributes of the card"
                onPress={onCardAttributesPress}
              />
            </YStack>
          </YStack>
        </ScrollView>
        <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
          <TextBackButton />
        </YStack>
      </FlexPage>
      <DeleteCredentialSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        id={credential.id}
        name={credential.display.name}
      />
    </>
  )
}
