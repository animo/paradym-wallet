import {
  AnimatedStack,
  Heading,
  HeroIcons,
  IconContainer,
  MiniCard,
  OptionSheet,
  Paragraph,
  ScrollView,
  Sheet,
  Spacer,
  Stack,
  XStack,
  YStack,
  useSpringify,
  useToastController,
} from '@package/ui'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'solito/router'

import { CredentialAttributes, TextBackButton } from '@package/app/src/components'
import { useHasInternetConnection, useScrollViewPosition } from '@package/app/src/hooks'

import { usePidCredential } from '@easypid/hooks'
import { useCredentialsForDisplay } from '@package/agent'
import { formatDate } from '@package/utils'
import { useNavigation } from 'expo-router'
import { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeRequestedAttributesDetailScreenProps {
  id: string
  disclosedPayload: Record<string, unknown>
  disclosedAttributeLength: number
}

export function FunkeRequestedAttributesDetailScreen({
  id,
  disclosedPayload,
  disclosedAttributeLength,
}: FunkeRequestedAttributesDetailScreenProps) {
  const hasInternet = useHasInternetConnection()
  const toast = useToastController()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { isLoading, credentials } = useCredentialsForDisplay()
  const router = useRouter()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const [isMetadataVisible, setIsMetadataVisible] = useState(false)
  const navigation = useNavigation()

  const { credential: pidCredential } = usePidCredential()
  const credential = credentials.find((cred) => cred.id.includes(id))
  const activeCredential = pidCredential?.id.includes(id) ? pidCredential : credential

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <IconContainer icon={<HeroIcons.EllipsisHorizontal />} onPress={() => setIsSheetOpen(true)} />,
    })
  }, [navigation])

  if (isLoading) {
    return null
  }

  if (!credential) {
    toast.show('Error getting credential details', {
      message: 'Credential not found',
      customData: {
        preset: 'danger',
      },
    })
    router.back()
    return null
  }

  const displayedMetadata = useMemo(() => {
    const metadata: Record<string, unknown> = {
      type: credential.metadata.type,
      issuer: credential.metadata.issuer,
    }

    // Add optional fields only if they are present
    if (credential.metadata.issuedAt) metadata.issuedAt = formatDate(credential.metadata.issuedAt)
    if (credential.metadata.validFrom) metadata.validFrom = formatDate(credential.metadata.validFrom)
    if (credential.metadata.validUntil) metadata.validUntil = formatDate(credential.metadata.validUntil)

    return metadata
  }, [credential])

  const toggleMetadataVisibility = () => {
    setIsSheetOpen(false) // Close the sheet first
    setTimeout(() => {
      setIsMetadataVisible(!isMetadataVisible)
    }, 200) // Delay to allow the sheet to close
  }

  return (
    <>
      <YStack bg="$background" height="100%" pb={bottom}>
        <Spacer size="$13" />
        <YStack borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
        <YStack
          fg={1}
          onLayout={(e) => {
            if (scrollViewHeight === 0) {
              setScrollViewHeight(e.nativeEvent.layout.height)
            }
          }}
        >
          <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle} height={scrollViewHeight}>
            <YStack g="xl" pad="lg" py="$4">
              <MiniCard
                backgroundImage={activeCredential?.display.backgroundImage?.url}
                backgroundColor={activeCredential?.display.backgroundColor ?? '$grey-900'}
                hasInternet={hasInternet}
              />
              <Stack g="md">
                <Heading variant="h1">
                  {disclosedAttributeLength} attribute{disclosedAttributeLength > 1 ? 's' : ''} from{' '}
                  {activeCredential?.display.name}
                </Heading>
                {activeCredential?.display.issuer && (
                  <Paragraph color="$grey-700">Issued by {activeCredential?.display.issuer.name}</Paragraph>
                )}
                <CredentialAttributes subject={disclosedPayload} headerStyle="small" />
                <AnimatedStack
                  key={isMetadataVisible ? 'visible' : 'hidden'}
                  exiting={useSpringify(FadeOutUp)}
                  entering={useSpringify(FadeInUp)}
                >
                  {isMetadataVisible && (
                    <CredentialAttributes
                      key="metadata"
                      headerTitle="Metadata"
                      subject={displayedMetadata}
                      headerStyle="small"
                      showDevProps
                    />
                  )}
                </AnimatedStack>
              </Stack>
            </YStack>
          </ScrollView>
        </YStack>
        <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
          <TextBackButton />
        </YStack>
      </YStack>
      <OptionSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        bottomPadding={bottom}
        items={[
          {
            icon: isMetadataVisible ? <HeroIcons.EyeSlash color="$grey-500" /> : <HeroIcons.Eye color="$grey-500" />,
            title: isMetadataVisible ? 'Hide metadata attributes' : 'Show metadata attributes',
            onPress: toggleMetadataVisibility,
          },
        ]}
      />
    </>
  )
}
