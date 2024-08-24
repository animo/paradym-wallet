import { Heading, HeroIcons, IdCard, Page, ScrollView, Spacer, Spinner, XStack, YStack } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'

import { usePidCredential } from '@easypid/hooks'
import { useNetworkCallback } from '@package/app/src/hooks'
import germanIssuerImage from '../../../assets/german-issuer-image.png'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const { isLoading, credential } = usePidCredential()
  const { bottom } = useSafeAreaInsets()
  const navigateToPidDetail = () => push('/credentials/pid')
  const navigateToScanner = useNetworkCallback(() => push('/scan'))

  if (isLoading) {
    return (
      <Page jc="center" ai="center">
        <Spinner />
      </Page>
    )
  }

  return (
    <>
      <XStack position="absolute" width="100%" zIndex={5} justifyContent="center" bottom={bottom ?? '$6'}>
        <YStack
          bg="$grey-900"
          br="$12"
          borderWidth="$2"
          borderColor="#e9e9eb"
          p="$3.5"
          pressStyle={{ backgroundColor: '$grey-800' }}
          shadowOffset={{ width: 5, height: 5 }}
          shadowColor="$grey-500"
          shadowOpacity={0.5}
          shadowRadius={10}
          onPress={() => navigateToScanner()}
        >
          <HeroIcons.QrCode color="$grey-100" size={48} />
        </YStack>
      </XStack>

      <YStack bg="$background" py="$4" height="100%" position="relative">
        <ScrollView px="$4" gap="$2">
          <YStack gap="$4">
            <Heading variant="title" fontWeight="$bold">
              {credential.userName}'s Wallet
            </Heading>
            <IdCard issuerImage={germanIssuerImage} onPress={navigateToPidDetail} hideUserName />
            <Spacer />
            <Heading variant="h1">Recent Activity</Heading>
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
