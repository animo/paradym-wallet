import {
  AnimatedStack,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  MessageBox,
  OptionSheet,
  ScrollView,
  type ScrollViewRefType,
  YStack,
  useSpringify,
  useToastController,
} from '@package/ui'
import React, { useEffect, useRef, useState } from 'react'

import { CredentialAttributes } from '@package/app/src/components'
import { useHeaderRightAction, useScrollViewPosition } from '@package/app/src/hooks'
import { TextBackButton } from 'packages/app'

import { useNavigation, useRouter } from 'expo-router'
import { FadeOutUp } from 'react-native-reanimated'
import { FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeCredentialDetailAttributesScreenProps {
  attributes: Record<string, unknown>
  metadata: Record<string, unknown>
}

export function FunkeCredentialDetailAttributesScreen({
  attributes,
  metadata,
}: FunkeCredentialDetailAttributesScreenProps) {
  const toast = useToastController()
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const [isMetadataVisible, setIsMetadataVisible] = useState(false)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [elementPosition, setElementPosition] = useState(0)
  const scrollViewRef = useRef<ScrollViewRefType>(null)

  useHeaderRightAction({
    icon: <HeroIcons.EllipsisHorizontal />,
    onPress: () => setIsSheetOpen(true),
  })

  const toggleMetadataVisibility = () => {
    setIsSheetOpen(false)

    // Delay to allow the sheet to close
    setTimeout(() => {
      const newMetadataVisibility = !isMetadataVisible

      if (!newMetadataVisibility) {
        // If metadata is set to false, scroll to 0 immediately
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
        setTimeout(() => {
          setIsMetadataVisible(false)
        }, 100)
      } else {
        // Delay 300ms and then scroll
        setIsMetadataVisible(true)
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: elementPosition, animated: true })
        }, 300)
      }
    }, 200)
  }

  if (!attributes) {
    toast.show('No attributes found', {
      customData: {
        preset: 'danger',
      },
    })
    router.back()
    return
  }

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
        <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
          <YStack gap="$4" p="$4" marginBottom={bottom}>
            <Heading variant="h1">Card attributes</Heading>
            <MessageBox
              icon={<HeroIcons.EyeSlash />}
              variant="info"
              message="This overview is only for you. Only share information using a QR code."
            />
            <CredentialAttributes
              headerStyle="small"
              borderStyle="large"
              attributeWeight="medium"
              subject={attributes}
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
                  subject={metadata}
                  headerStyle="small"
                  showDevProps
                />
              )}
            </AnimatedStack>
          </YStack>
        </ScrollView>
        <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
          <TextBackButton />
        </YStack>
      </FlexPage>
      <OptionSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
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
