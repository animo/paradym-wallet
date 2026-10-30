import { metadataForDisplay } from '@app/utils/metadataForDisplay'
import { useLingui } from '@lingui/react/macro'
import { CredentialAttributes } from '@package/app/components'
import { useHaptics, useHeaderRightActions, useScrollViewPosition } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  HeaderContainer,
  HeroIcons,
  OptionSheet,
  ScrollView,
  type ScrollViewRefType,
  useScrollToggle,
  useSpringify,
  YStack,
} from '@package/ui'
import type { CredentialForDisplay } from '@paradym/wallet-sdk'
import { useRef, useState } from 'react'
import { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomCredentialAttributes, hasCustomCredentialDisplay } from './CustomCredentialAttributes'

interface CredentialDetailAttributesProps {
  credential: CredentialForDisplay
  // Adds a delete action next to the menu, for when the card is shown next to the attributes
  onDelete?: () => void
}

export function CredentialDetailAttributes({ credential, onDelete }: CredentialDetailAttributesProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { withHaptics } = useHaptics()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const { t } = useLingui()

  // Check if custom display is available: either has custom rendering or has different displayed vs all attributes
  const isCustomDisplayAvailable = hasCustomCredentialDisplay(credential.metadata.type)

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

  const openMenu = withHaptics(() => setIsSheetOpen(true))

  const handleToggleMetadata = withHaptics(() => {
    setIsSheetOpen(false)
    toggleMetadata()
  })

  const handleToggleShareableAttributes = withHaptics(() => {
    setIsSheetOpen(false)
    toggleShareableAttributes()
  })

  return (
    <>
      <HeaderActions onMenu={openMenu} onDelete={onDelete} />
      <HeaderContainer
        isScrolledByOffset={isScrolledByOffset}
        title={t({
          id: 'credentials.cardAttributes',
          message: 'Card attributes',
          comment: 'Title shown in header for the credential detail attributes screen',
        })}
      />
      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack px="4" gap="4" marginBottom={bottom}>
          <CustomCredentialAttributes credential={credential} scrollRef={scrollViewRef} />
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
                scrollRef={scrollViewRef}
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
                headerTitle={t(commonMessages.metadataHeading)}
                attributes={metadataForDisplay(credential.metadata)}
                scrollRef={scrollViewRef}
              />
            )}
          </AnimatedStack>
        </YStack>
      </ScrollView>
      <OptionSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        items={[
          ...(isCustomDisplayAvailable
            ? [
                {
                  icon: isShareableAttributesVisible ? (
                    <HeroIcons.EyeSlash color="grey-500" />
                  ) : (
                    <HeroIcons.Eye color="grey-500" />
                  ),
                  title: isShareableAttributesVisible
                    ? t({
                        id: 'credentials.hideShareableAttributes',
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
            icon: <HeroIcons.CodeBracketFilled color="grey-500" />,
            title: isMetadataVisible
              ? t(commonMessages.hideMetadataAttributes)
              : t(commonMessages.showMetadataAttributes),
            onPress: handleToggleMetadata,
          },
        ]}
      />
    </>
  )
}

function HeaderActions({ onMenu, onDelete }: { onMenu: () => void; onDelete?: () => void }) {
  useHeaderRightActions([
    { icon: <HeroIcons.Trash />, onPress: onDelete ?? (() => {}), renderCondition: !!onDelete },
    { icon: <HeroIcons.EllipsisHorizontal />, onPress: onMenu },
  ])

  return null
}
