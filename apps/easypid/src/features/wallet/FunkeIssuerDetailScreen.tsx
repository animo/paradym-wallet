import {
  Circle,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  MessageBox,
  Paragraph,
  ScrollView,
  type ScrollViewRefType,
  XStack,
  YStack,
} from '@package/ui'
import { useTrustedEntities } from 'packages/agent/src'
import { TextBackButton, useScrollViewPosition } from 'packages/app/src'
import { useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeIssuerDetailScreenProps {
  name: string
  logo?: string
  entityId?: string
  trustedEntityIds?: string[]
}

export function FunkeIssuerDetailScreen({ name, logo, entityId, trustedEntityIds = [] }: FunkeIssuerDetailScreenProps) {
  const { trustedEntities } = useTrustedEntities()

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollViewRefType>(null)

  return (
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
          <Heading variant="h1">About this party</Heading>
          <MessageBox
            variant="light"
            message="Always consider whether sharing with a party is wise."
            icon={<HeroIcons.ExclamationTriangleFilled />}
          />
          <XStack gap="$4" pt="$2">
            {logo ? (
              <Circle overflow="hidden" ai="center" jc="center" size="$6" bw={1} borderColor="$grey-200" bg="$grey-100">
                <Image src={logo} height="100%" width="100%" />
              </Circle>
            ) : (
              <Circle overflow="hidden" ai="center" jc="center" size="$6" bw={1} borderColor="$grey-200" bg="$grey-100">
                <HeroIcons.BuildingOffice color="$grey-700" />
              </Circle>
            )}
            <YStack>
              <Heading variant="h2">{name}</Heading>
              <Paragraph fontWeight="$medium" color="$primary-500">
                Website
              </Paragraph>
            </YStack>
          </XStack>
          <YStack gap="$4" py="$2">
            <YStack gap="$2">
              <Heading variant="sub2">Trusted by</Heading>
              <Paragraph>
                A list of organizations and whether they have approved{' '}
                <Paragraph fontWeight="$semiBold">{name}</Paragraph>.
              </Paragraph>
            </YStack>
            <YStack gap="$2">
              {trustedEntities.map((entity) => {
                const isTrusted = trustedEntityIds.includes(entity.entity_id)

                return (
                  <XStack
                    ai="center"
                    key={entity.entity_id}
                    br="$8"
                    p="$3.5"
                    gap="$3"
                    bw="$0.5"
                    borderColor={isTrusted ? '$success-500' : '$danger-300'}
                    bg={isTrusted ? '$success-500' : '$danger-300'}
                  >
                    {entity.logo_uri && (
                      <Circle overflow="hidden" size="$4" bg="$grey-50">
                        <Image src={entity.logo_uri} height="100%" width="100%" />
                      </Circle>
                    )}
                    <XStack gap="$1" f={1} justifyContent="space-between">
                      <Heading variant="h2">{entity.organization_name}</Heading>
                      <IconContainer
                        icon={
                          isTrusted ? (
                            <HeroIcons.CheckCircleFilled color="$success-500" />
                          ) : (
                            <HeroIcons.X color="$danger-500" />
                          )
                        }
                      />
                    </XStack>
                  </XStack>
                )
              })}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
