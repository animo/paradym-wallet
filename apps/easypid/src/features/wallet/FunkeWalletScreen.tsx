import { ActivityRowItem, Heading, HeroIcons, IdCard, Page, ScrollView, Spinner, XStack, YStack } from '@package/ui'
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
          <YStack gap="$6">
            <XStack ai="center" justifyContent="space-between">
              <Heading variant="title" fontSize={32} fontWeight="$bold">
                {credential.userName}'s wallet
              </Heading>
              <XStack p="$2" mr={-4} onPress={() => push('/menu')}>
                <HeroIcons.Menu size={28} color="$black" />
              </XStack>
            </XStack>
            <IdCard issuerImage={germanIssuerImage} onPress={navigateToPidDetail} hideUserName />
            <YStack gap="$5" w="100%">
              <Heading variant="h2" fontWeight="$semiBold">
                Recent activity
              </Heading>
              <YStack gap="$4" w="100%">
                <ActivityRowItem title="Shared data" subtitle="Bundesdruckerei Gmhb1231231231" date={new Date()} />
                <ActivityRowItem title="Shared data" subtitle="Bundesdruckerei Gmhb" date={new Date()} />
                <ActivityRowItem title="Shared data" subtitle="Bundesdruckerei Gmhb" date={new Date()} />
              </YStack>
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
