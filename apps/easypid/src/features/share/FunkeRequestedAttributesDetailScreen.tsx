import {
  AnimatedStack,
  Heading,
  HeroIcons,
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
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'

import { CredentialAttributes, FunkeCredentialCard, TextBackButton } from '@package/app/components'
import { useHaptics, useHeaderRightAction, useScrollViewPosition } from '@package/app/hooks'

import { type CredentialForDisplayId, metadataForDisplay, useCredentialForDisplayById } from '@package/agent'
import { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useLingui } from '@lingui/react/macro'

interface FunkeRequestedAttributesDetailScreenProps {
  id: CredentialForDisplayId
  disclosedPayload: Record<string, unknown>
  disclosedAttributeLength: number
}

export function FunkeRequestedAttributesDetailScreen({
  id,
  disclosedPayload,
  disclosedAttributeLength,
}: FunkeRequestedAttributesDetailScreenProps) {
  const toast = useToastController()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { credential: activeCredential, isLoading } = useCredentialForDisplayById(id)
  const router = useRouter()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { withHaptics } = useHaptics()
  const { t } = useLingui()

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const scrollViewRef = useRef<ScrollViewRefType>(null)

  useHeaderRightAction({
    icon: <HeroIcons.EllipsisHorizontal />,
    onPress: withHaptics(() => setIsSheetOpen(true)),
  })

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
    toast.show(
      t({
        id: 'credentialDetail.errorTitle',
        message: 'Error getting credential details',
        comment: 'Title shown in toast when credential cannot be loaded',
      }),
      {
        message: t({
          id: 'credentialDetail.errorMessage',
          message: 'Credential not found',
          comment: 'Error message when a credential is missing',
        }),
        customData: {
          preset: 'danger',
        },
      }
    )
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
            <YStack gap="$6" pad="lg" py="$4">
              <Stack width="100%" mt="$-3" mb="$-5" scale={0.75}>
                <FunkeCredentialCard
                  issuerImage={{
                    url: activeCredential.display.issuer.logo?.url,
                    altText: activeCredential.display.issuer.logo?.altText,
                  }}
                  textColor={activeCredential.display.textColor}
                  name={activeCredential.display.name}
                  backgroundImage={{
                    url: activeCredential.display.backgroundImage?.url,
                    altText: activeCredential.display.backgroundImage?.altText,
                  }}
                  bgColor={activeCredential.display.backgroundColor ?? '$grey-900'}
                />
              </Stack>
              <Stack gap="$4">
                <Stack gap="$2">
                  <Heading ta="center" variant="h1">
                    {t({
                      id: 'requestedAttributes.heading',
                      message: 'Requested attributes',
                      comment: 'Heading above list of attributes shown to the user',
                    })}
                  </Heading>
                  <Paragraph ta="center">
                    {t({
                      id: 'requestedAttributes.subheading',
                      message: `${disclosedAttributeLength} from ${activeCredential.display.name}`,
                      comment: 'Subheading under attribute list: X from Y',
                    })}
                  </Paragraph>
                </Stack>
                <CredentialAttributes attributes={disclosedPayload} />
                <AnimatedStack
                  key={isMetadataVisible ? 'visible' : 'hidden'}
                  onLayout={(event) => setElementPosition(event.nativeEvent.layout.y)}
                  exiting={useSpringify(FadeOutUp)}
                  entering={useSpringify(FadeInUp)}
                >
                  {isMetadataVisible && (
                    <CredentialAttributes
                      key="metadata"
                      headerTitle={t({
                        id: 'requestedAttributes.metadataTitle',
                        message: 'Metadata',
                        comment: 'Section header title for metadata attributes',
                      })}
                      attributes={metadataForDisplay(activeCredential.metadata)}
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
            title: isMetadataVisible
              ? t({
                id: 'optionSheet.hideMetadata',
                message: 'Hide metadata attributes',
                comment: 'Option to hide metadata in option sheet',
              })
              : t({
                id: 'optionSheet.showMetadata',
                message: 'Show metadata attributes',
                comment: 'Option to show metadata in option sheet',
              }),
            onPress: handleToggleMetadata,
          },
        ]}
      />
    </>
  )
}
