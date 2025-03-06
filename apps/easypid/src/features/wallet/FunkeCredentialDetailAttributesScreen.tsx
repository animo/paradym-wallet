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
import { useRef, useState } from 'react'

import { CredentialAttributes } from '@package/app/src/components'
import { useHaptics, useHeaderRightAction, useScrollViewPosition } from '@package/app/src/hooks'
import { TextBackButton } from 'packages/app'

import { type CredentialForDisplayId, metadataForDisplay, useCredentialForDisplayById } from '@package/agent'
import { useRouter } from 'expo-router'
import { FadeOutUp } from 'react-native-reanimated'
import { FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createParam } from 'solito'
import { CustomCredentialAttributes, hasCustomCredentialDisplay } from './components/CustomCredentialAttributes'

const { useParams } = createParam<{ id: CredentialForDisplayId }>()

export function FunkeCredentialDetailAttributesScreen() {
  const { params } = useParams()
  const { credential } = useCredentialForDisplayById(params.id)

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
    isVisible: isSharableAttributesVisible,
    setElementPosition: setSharableAttributesElementPosition,
    toggle: toggleSharableAttributes,
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

  const handleToggleSharableAttributes = withHaptics(() => {
    setIsSheetOpen(false)
    toggleSharableAttributes()
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
              key={isSharableAttributesVisible ? 'visible-sharable-attributes' : 'hidden-sharable-attributes'}
              onLayout={(event) => setSharableAttributesElementPosition(event.nativeEvent.layout.y)}
              exiting={useSpringify(FadeOutUp)}
              entering={useSpringify(FadeInUp)}
            >
              {isSharableAttributesVisible && (
                <CredentialAttributes
                  key="sharable-attributes"
                  headerTitle="Sharable attributes"
                  subject={credential.attributes}
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
                  subject={metadataForDisplay(credential.metadata)}
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
                  icon: isSharableAttributesVisible ? (
                    <HeroIcons.EyeSlash color="$grey-500" />
                  ) : (
                    <HeroIcons.Eye color="$grey-500" />
                  ),
                  title: isSharableAttributesVisible ? 'Hide shareable attributes' : 'Show shareable attributes',
                  onPress: handleToggleSharableAttributes,
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
