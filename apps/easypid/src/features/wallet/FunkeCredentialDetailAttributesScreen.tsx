import { CredentialAttributes, TextBackButton } from '@package/app'
import { useHaptics, useHeaderRightAction, useScrollViewPosition } from '@package/app'
import {
  AnimatedStack,
  FlexPage,
  HeaderContainer,
  HeroIcons,
  OptionSheet,
  ScrollView,
  type ScrollViewRefType,
  YStack,
  useScrollToggle,
  useSpringify,
  useToastController,
} from '@package/ui'
import { metadataForDisplay } from '@paradym/wallet-sdk/display/common'
import { type CredentialId, useCredentialById } from '@paradym/wallet-sdk/hooks/useCredentialById'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { FadeOutUp } from 'react-native-reanimated'
import { FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomCredentialAttributes, hasCustomCredentialDisplay } from './components/CustomCredentialAttributes'

export function FunkeCredentialDetailAttributesScreen() {
  const { id } = useLocalSearchParams<{ id: CredentialId }>()
  const { credential } = useCredentialById(id)

  const toast = useToastController()
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { withHaptics } = useHaptics()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const isCustomDisplayAvailable = credential?.metadata.type
    ? hasCustomCredentialDisplay(credential?.metadata.type)
    : false

  const {
    isVisible: isMetadataVisible,
    setElementPosition: setMetadataElementPosition,
    toggle: toggleMetadata,
  } = useScrollToggle({
    scrollRef: scrollViewRef,
  })

  const {
    isVisible: isShareableAttributesVisible,
    setElementPosition: setShareableAttributesElementPosition,
    toggle: toggleShareableAttributes,
  } = useScrollToggle({
    scrollRef: scrollViewRef,
  })

  useHeaderRightAction({
    icon: <HeroIcons.EllipsisHorizontal />,
    onPress: withHaptics(() => setIsSheetOpen(true)),
  })

  const handleToggleMetadata = withHaptics(() => {
    setIsSheetOpen(false)
    toggleMetadata()
  })

  const handleToggleShareableAttributes = withHaptics(() => {
    setIsSheetOpen(false)
    toggleShareableAttributes()
  })

  if (!credential) {
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
        <HeaderContainer isScrolledByOffset={isScrolledByOffset} title="Card attributes" />
        <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
          <YStack px="$4" gap="$4" marginBottom={bottom}>
            <CustomCredentialAttributes credential={credential} />
            <AnimatedStack
              key={isShareableAttributesVisible ? 'visible-shareable-attributes' : 'hidden-shareable-attributes'}
              onLayout={(event) => setShareableAttributesElementPosition(event.nativeEvent.layout.y)}
              exiting={useSpringify(FadeOutUp)}
              entering={useSpringify(FadeInUp)}
            >
              {isShareableAttributesVisible && (
                <CredentialAttributes
                  key="shareable-attributes"
                  headerTitle="Shareable attributes"
                  attributes={credential.attributes}
                />
              )}
            </AnimatedStack>
            <AnimatedStack
              key={isMetadataVisible ? 'visible-metadata' : 'hidden-metadata'}
              onLayout={(event) => setMetadataElementPosition(event.nativeEvent.layout.y)}
              exiting={useSpringify(FadeOutUp)}
              entering={useSpringify(FadeInUp)}
            >
              {isMetadataVisible && (
                <CredentialAttributes
                  key="metadata"
                  headerTitle="Metadata"
                  attributes={metadataForDisplay(credential.metadata)}
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
          ...(isCustomDisplayAvailable
            ? [
                {
                  icon: isShareableAttributesVisible ? (
                    <HeroIcons.EyeSlash color="$grey-500" />
                  ) : (
                    <HeroIcons.Eye color="$grey-500" />
                  ),
                  title: isShareableAttributesVisible ? 'Hide shareable attributes' : 'Show shareable attributes',
                  onPress: handleToggleShareableAttributes,
                },
              ]
            : []),
          {
            icon: isMetadataVisible ? (
              <HeroIcons.CodeBracketFilled color="$grey-500" />
            ) : (
              <HeroIcons.CodeBracketFilled color="$grey-500" />
            ),
            title: isMetadataVisible ? 'Hide metadata attributes' : 'Show metadata attributes',
            onPress: handleToggleMetadata,
          },
        ]}
      />
    </>
  )
}
