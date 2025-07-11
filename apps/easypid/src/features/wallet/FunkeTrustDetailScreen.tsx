import { useDevelopmentMode } from '@easypid/hooks'
import type { TrustMechanism, TrustedEntity } from '@package/agent'
import { TextBackButton, useScrollViewPosition } from '@package/app'
import {
  Circle,
  FlexPage,
  HeaderContainer,
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
import { useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type FunkeTrustDetailScreenProps = {
  trustMechanism: TrustMechanism
  name?: string
  logo?: string
  trustedEntities: Array<TrustedEntity>
  isDemoTrustedEntity?: boolean
}

export function FunkeTrustDetailScreen({
  trustMechanism,
  name,
  logo,
  trustedEntities = [],
  isDemoTrustedEntity = false,
}: FunkeTrustDetailScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const trustMechanismName =
    trustMechanism === 'eudi_rp_authentication'
      ? 'EU Trusted List'
      : trustMechanism === 'openid_federation'
        ? 'OpenID Federation'
        : trustMechanism === 'did'
          ? 'Decentralized Identifier'
          : 'X.509 Certificate'

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer title="About this party" isScrolledByOffset={isScrolledByOffset} />
      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack px="$4" gap="$4" marginBottom={bottom}>
          <MessageBox
            variant="light"
            message="Always consider whether sharing with a party is wise."
            icon={<HeroIcons.ExclamationTriangleFilled />}
          />

          <XStack gap="$4" pt="$2" ai="center">
            {logo ? (
              <Circle overflow="hidden" ai="center" jc="center" size="$6" bw={1} borderColor="$grey-200" bg="$grey-100">
                <Image src={logo} height="100%" width="100%" />
              </Circle>
            ) : (
              <Circle overflow="hidden" ai="center" jc="center" size="$6" bw={1} borderColor="$grey-200" bg="$grey-100">
                <HeroIcons.BuildingOffice color="$grey-700" />
              </Circle>
            )}
            <Heading flex={1} numberOfLines={3} variant="h2">
              {name || 'Unknown organization'} {isDemoTrustedEntity ? '(Demo)' : ''}
            </Heading>
          </XStack>

          <YStack gap="$4" py="$2">
            <YStack gap="$2">
              <Heading variant="sub2">
                Trusted by {isDevelopmentModeEnabled ? <Paragraph>({trustMechanismName})</Paragraph> : ''}
              </Heading>
              <Paragraph>
                {trustedEntities.length > 0 ? (
                  <>A list of organizations that have approved {name || 'this unknown organization'}.</>
                ) : (
                  <>There are no organizations that have approved {name || 'this unknown organization'}.</>
                )}
              </Paragraph>
            </YStack>
            <YStack gap="$2">
              {trustedEntities.map((entity) => (
                <XStack ai="center" key={entity.entityId} br="$8" p="$3.5" gap="$3" bg="$grey-100">
                  {entity.logoUri && (
                    <Circle overflow="hidden" size="$4" bg="$grey-50">
                      <Image src={entity.logoUri} height="100%" width="100%" />
                    </Circle>
                  )}
                  <XStack gap="$1" f={1} justifyContent="space-between" ai="center">
                    {entity.demo ? (
                      <>
                        <YStack>
                          <Heading f={1} numberOfLines={2} variant="h3">
                            {entity.organizationName}
                          </Heading>
                          {entity.demo && <Paragraph variant="sub">Demo organization</Paragraph>}
                        </YStack>

                        <IconContainer icon={<HeroIcons.ExclamationTriangleFilled size={30} color="$warning-500" />} />
                      </>
                    ) : (
                      <>
                        <Heading f={1} numberOfLines={2} variant="h3">
                          {entity.organizationName}
                        </Heading>
                        <IconContainer icon={<HeroIcons.CheckCircleFilled size={30} color="$positive-500" />} />
                      </>
                    )}
                  </XStack>
                </XStack>
              ))}
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
