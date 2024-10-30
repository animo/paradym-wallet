import {
  AnimatedStack,
  Heading,
  HeroIcons,
  IconContainer,
  MiniCard,
  OptionSheet,
  Paragraph,
  ScrollView,
  type ScrollViewRefType,
  Spacer,
  Stack,
  YStack,
  useScrollToggle,
  useSpringify,
  useToastController,
} from '@package/ui'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'solito/router'

import { CredentialAttributes, TextBackButton } from '@package/app/src/components'
import { useHaptics, useHasInternetConnection, useScrollViewPosition } from '@package/app/src/hooks'

import { useCredentialsWithCustomDisplay } from '@easypid/hooks/useCredentialsWithCustomDisplay'
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
  const { isLoading, credentials } = useCredentialsWithCustomDisplay()
  const router = useRouter()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { withHaptics } = useHaptics()
  const navigation = useNavigation()

  const activeCredential = credentials.find((cred) => cred.id.includes(id))

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const scrollViewRef = useRef<ScrollViewRefType>(null)

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <IconContainer icon={<HeroIcons.EllipsisHorizontal />} onPress={() => setIsSheetOpen(true)} />,
    })
  }, [navigation])

  const {
    isVisible: isMetadataVisible,
    setElementPosition,
    toggle,
  } = useScrollToggle({
    scrollRef: scrollViewRef,
  })

  const handleToggleMetadata = withHaptics(() => {
    setIsSheetOpen(false)
    toggle()
  })

  if (isLoading) return null

  if (!activeCredential) {
    toast.show('Error getting credential details', {
      message: 'Credential not found',
      customData: {
        preset: 'danger',
      },
    })
    router.back()
    return null
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
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={scrollEventThrottle}
            height={scrollViewHeight}
          >
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
                  <Paragraph>Issued by {activeCredential?.display.issuer.name}.</Paragraph>
                )}
                <CredentialAttributes
                  subject={disclosedPayload}
                  headerStyle="small"
                  borderStyle="large"
                  attributeWeight="medium"
                />
                <AnimatedStack
                  key={isMetadataVisible ? 'visible' : 'hidden'}
                  onLayout={(event) => setElementPosition(event.nativeEvent.layout.y)}
                  exiting={useSpringify(FadeOutUp)}
                  entering={useSpringify(FadeInUp)}
                >
                  {isMetadataVisible && (
                    <CredentialAttributes
                      key="metadata"
                      headerTitle="Metadata"
                      borderStyle="large"
                      attributeWeight="medium"
                      subject={activeCredential?.metadata as Record<string, unknown>}
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
        items={[
          {
            icon: isMetadataVisible ? <HeroIcons.EyeSlash color="$grey-500" /> : <HeroIcons.Eye color="$grey-500" />,
            title: isMetadataVisible ? 'Hide metadata attributes' : 'Show metadata attributes',
            onPress: handleToggleMetadata,
          },
        ]}
      />
    </>
  )
}
