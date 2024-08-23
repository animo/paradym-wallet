import { Button, Heading, HeroIcons, IdCard, Page, ScrollView, Spacer, Spinner, XStack, YStack } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'

import { usePidCredential } from '@easypid/hooks'
import { useCredentialDataHandler, useNetworkCallback } from '@package/app/src/hooks'
import { capitalizeFirstLetter } from '@package/utils'
import germanIssuerImage from '../../../assets/german-issuer-image.png'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const { isLoading, credential } = usePidCredential()
  const { bottom } = useSafeAreaInsets()
  const navigateToPidDetail = () => push('/credentials/pid')
  const navigateToScanner = useNetworkCallback(() => push('/scan'))
  const { handleCredentialData } = useCredentialDataHandler()

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
              {capitalizeFirstLetter(credential.attributes.given_name.toLowerCase())}'s Wallet
            </Heading>
            <IdCard issuerImage={germanIssuerImage} onPress={navigateToPidDetail} hideUserName />
            <Spacer />
            <Button.Solid
              onPress={() => {
                fetch('https://funke.animo.id/api/requests/create', {
                  headers: {
                    'content-type': 'application/json',
                  },
                  body: '{"presentationDefinition":{"id":"e0c66204-641f-4a84-8518-ad6599b0a284","name":"PID Credential request for C","purpose": "Something special", "input_descriptors":[{"id":"40dbb911-3277-4917-9f1b-74dd8631214a","constraints":{"limit_disclosure":"preferred","fields":[{"path":["$.given_name"]},{"path":["$.family_name"]},{"path":["$.age_equal_or_over.21"],"filter":{"type":"boolean","const":true}},{"path":["$.nationalities"]},{"path":["$.iss"],"filter":{"type":"string","enum":["https://demo.pid-issuer.bundesdruckerei.de/c","https://demo.pid-issuer.bundesdruckerei.de/c1"]}},{"path":["$.vct"],"filter":{"type":"string","enum":["https://example.bmi.bund.de/credential/pid/1.0","urn:eu.europa.ec.eudi:pid:1"]}}]},"name":"PID Name","purpose":"Verify your name"}]}}',
                  method: 'POST',
                })
                  .then((r) => r.json())
                  .then((data) => handleCredentialData(data.authorizationRequestUri))
                  .catch((e) => console.error('e', e))
              }}
            >
              Create Presentation
            </Button.Solid>
            <Spacer />
            <Heading variant="h1">Recent Activity</Heading>
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
