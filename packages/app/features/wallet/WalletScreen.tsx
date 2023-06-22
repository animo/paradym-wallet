import { getCredentialForDisplay, useW3cCredentialRecords } from '@internal/agent'
import {
  AnimatePresence,
  BASE_CREDENTIAL_CARD_HEIGHT,
  CREDENTIAL_TOP_INFO_HEIGHT,
  CREDENTIAL_TOP_INFO_OFFSET,
  HEADER_TITLE_TEXT_HEIGHT,
  Heading,
  Logo,
  Page,
  Paragraph,
  Scan,
  ScrollView,
  Spinner,
  TableContainer,
  XStack,
  YStack,
  ZStack,
} from '@internal/ui'
import { useRouter } from 'solito/router'

import CredentialCard from 'app/components/CredentialCard'
import CredentialRowCard from 'app/components/CredentialRowCard'
import NoContentWallet from 'app/components/NoContentWallet'
import { useNetworkCallback } from 'app/hooks/useNetworkCallback'
import useScrollViewPosition from 'app/hooks/useScrollViewPosition'

export function WalletScreen() {
  const { push } = useRouter()
  const { w3cCredentialRecords, isLoading } = useW3cCredentialRecords()
  const firstThreeRecords = w3cCredentialRecords.slice(0, 3)
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } =
    useScrollViewPosition(HEADER_TITLE_TEXT_HEIGHT)

  const navigateToCredentialDetail = (id: string) => push(`/credentials/${id}`)
  const navigateToScanner = useNetworkCallback(() => push('/scan'))

  if (isLoading) {
    return (
      <Page jc="center" ai="center">
        <Spinner />
      </Page>
    )
  }

  return (
    <YStack bg="$grey-200" height="100%" position="relative">
      {w3cCredentialRecords.length !== 0 && (
        <YStack
          zIndex="$5"
          position="absolute"
          right="$6"
          bottom="$6"
          bg="$grey-900"
          br="$12"
          p="$4"
          pressStyle={{ backgroundColor: '$grey-800' }}
          shadowOffset={{ width: 5, height: 5 }}
          shadowColor="$grey-500"
          shadowOpacity={0.5}
          shadowRadius={10}
          onPress={() => navigateToScanner()}
        >
          <Scan color="$grey-100" />
        </YStack>
      )}
      <XStack h="$4" jc="center" px="$4" py="$2" border={isScrolledByOffset} borderTopWidth={0}>
        <AnimatePresence exitBeforeEnter>
          {isScrolledByOffset ? (
            <Paragraph
              key="wallet-mini-header"
              textAlign="center"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              opacity={1}
              animation="medium"
            >
              Credentials
            </Paragraph>
          ) : (
            <XStack
              key="logo"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              opacity={1}
              animation="medium"
            >
              <Logo />
            </XStack>
          )}
        </AnimatePresence>
      </XStack>
      {w3cCredentialRecords.length === 0 ? (
        <NoContentWallet />
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle} px="$4">
          <YStack g="md" width="100%">
            <Heading variant="h3" textAlign="left" secondary>
              Recently added
            </Heading>
            <ZStack
              f={0}
              flexBasis="auto"
              height={
                BASE_CREDENTIAL_CARD_HEIGHT + firstThreeRecords.length * CREDENTIAL_TOP_INFO_OFFSET
              }
            >
              {firstThreeRecords.map((credentialRecord, idx) => {
                const { display } = getCredentialForDisplay(credentialRecord)
                return (
                  <XStack
                    key={credentialRecord.id}
                    mt={CREDENTIAL_TOP_INFO_HEIGHT * idx}
                    br="$8"
                    borderColor="$lightTranslucent"
                    borderWidth={0.5}
                  >
                    <CredentialCard
                      onPress={() => navigateToCredentialDetail(credentialRecord.id)}
                      issuerImage={display.issuer.logo}
                      backgroundImage={display.backgroundImage}
                      textColor={display.textColor}
                      name={display.name}
                      issuerName={display.issuer.name}
                      subtitle={display.description}
                      bgColor={display.backgroundColor}
                      shadow={false}
                    />
                  </XStack>
                )
              })}
            </ZStack>
          </YStack>
          <YStack g="md">
            <Heading variant="h3" textAlign="left" secondary>
              Credentials
            </Heading>
            <TableContainer>
              {w3cCredentialRecords.map((credentialRecord, idx) => {
                const { display } = getCredentialForDisplay(credentialRecord)
                return (
                  <CredentialRowCard
                    key={credentialRecord.id}
                    name={display.name}
                    issuer={display.issuer.name}
                    bgColor={display.backgroundColor}
                    onPress={() => navigateToCredentialDetail(credentialRecord.id)}
                    hideBorder={
                      w3cCredentialRecords.length === 1 || idx === w3cCredentialRecords.length - 1
                    }
                  />
                )
              })}
            </TableContainer>
          </YStack>
        </ScrollView>
      )}
    </YStack>
  )
}
