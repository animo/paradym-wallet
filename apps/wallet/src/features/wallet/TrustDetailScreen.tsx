import { useLingui } from '@lingui/react/macro'
import { BackFooter, useScrollViewPosition } from '@package/app'
import { FlexPage, HeaderContainer, ScrollView, type ScrollViewRefType, YStack } from '@package/ui'
import { useRef } from 'react'
import { Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TrustDetails, type TrustDetailsProps, trustDetailsTitle } from './components/TrustDetails'

export type TrustDetailScreenProps = Omit<TrustDetailsProps, 'onOpenLink'>

export function TrustDetailScreen({
  name,
  logo,
  trustedEntities = [],
  isDemoTrustedEntity = false,
  registration,
}: TrustDetailScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const { t } = useLingui()

  return (
    <FlexPage gap="0" paddingHorizontal="0">
      <HeaderContainer title={t(trustDetailsTitle)} isScrolledByOffset={isScrolledByOffset} />

      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack px="5" marginBottom={bottom}>
          <TrustDetails
            name={name}
            logo={logo}
            trustedEntities={trustedEntities}
            isDemoTrustedEntity={isDemoTrustedEntity}
            registration={registration}
            onOpenLink={(url) => Linking.openURL(url)}
          />
        </YStack>
      </ScrollView>

      <BackFooter />
    </FlexPage>
  )
}
