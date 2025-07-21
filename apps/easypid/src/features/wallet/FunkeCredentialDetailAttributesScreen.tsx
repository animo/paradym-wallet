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

import { CredentialAttributes, TextBackButton } from '@package/app/components'
import { useHaptics, useHeaderRightAction, useScrollViewPosition } from '@package/app/hooks'

import { type CredentialForDisplayId, metadataForDisplay, useCredentialForDisplayById } from '@package/agent'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FadeOutUp } from 'react-native-reanimated'
import { FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomCredentialAttributes, hasCustomCredentialDisplay } from './components/CustomCredentialAttributes'
import { useLingui } from '@lingui/react/macro'

export function FunkeCredentialDetailAttributesScreen() {
  const { id } = useLocalSearchParams<{ id: CredentialForDisplayId }>()
  const { credential } = useCredentialForDisplayById(id)

  const toast = useToastController()
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { withHaptics } = useHaptics()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const { t } = useLingui()
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
    toast.show(
      t({
        id: 'credentials.noAttributes',
        message: 'No attributes found',
        comment: 'Error toast when a credential has no displayable attributes',
      }),
      {
        customData: {
          preset: 'danger',
        },
      }
    )
    router.back()
    return
  }

  return (
    <>
      <FlexPage gap="$0" paddingHorizontal="$0">
        <HeaderContainer
          isScrolledByOffset={isScrolledByOffset}
          title={t({
            id: 'credentials.cardAttributes',
            message: 'Card attributes',
            comment: 'Title shown in header for the credential detail attributes screen',
          })}
        />
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
                  headerTitle={t({
                    id: 'credentials.shareableAttributes',
                    message: 'Shareable attributes',
                    comment: 'Header for attributes that can be shared with a verifier',
                  })}
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
                  headerTitle={t({
                    id: 'credentials.metadataAttributes',
                    message: 'Metadata',
                    comment: 'Header for metadata attributes of a credential',
                  })}
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
               title:isShareableAttributesVisible ?  t({
                  id:  'credentials.hideShareableAttributes',
                  message: 'Hide shareable attributes',
                  comment: 'Button label that toggles visibility of shareable attributes',
                }) 
		            : t({
                  id: 'credentials.showShareableAttributes',
                  message: 'Show shareable attributes',
                  comment: 'Button label that toggles visibility of shareable attributes',
                }),
                onPress: handleToggleShareableAttributes,
              },
            ]
            : []),
          {
            icon: <HeroIcons.CodeBracketFilled color="$grey-500" />,
            title: isMetadataVisible ?  t({
              id: 'credentials.hideMetadata',
              message: 'Hide metadata attributes',
              comment: 'Button label: toggles visibility of metadata attributes',
            }) : t({
              id: 'credentials.showMetadata',
              message: 'Show metadata attributes',
              comment: 'Button label: toggles visibility of metadata attributes',
            }),
            onPress: handleToggleMetadata,
          },
        ]}
      />
    </>
  )
}
