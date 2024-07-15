import { useCredentialsForDisplay } from '@package/agent'
import {
  AnimatePresence,
  BASE_CREDENTIAL_CARD_HEIGHT,
  CREDENTIAL_TOP_INFO_HEIGHT,
  CREDENTIAL_TOP_INFO_OFFSET,
  HEADER_TITLE_TEXT_HEIGHT,
  Heading,
  Logo,
  LucideIcon,
  Page,
  Paragraph,
  ScrollView,
  Spinner,
  TableContainer,
  XStack,
  YStack,
  ZStack,
} from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'

import { CredentialCard, CredentialRowCard, InboxIcon, NoContentWallet } from '../../components'
import { useNetworkCallback, useScrollViewPosition } from '../../hooks'

type WalletScreenProps = {
  logo: number
}

export function WalletScreen({ logo }: WalletScreenProps) {
  const { push } = useRouter()
  const { isLoading, credentials } = useCredentialsForDisplay()
  const firstThreeRecords = credentials.slice(0, 3)
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition(HEADER_TITLE_TEXT_HEIGHT)
  const { bottom } = useSafeAreaInsets()
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
    <YStack bg="$background" height="100%" position="relative">
      {credentials.length !== 0 && (
        <YStack
          zIndex="$5"
          position="absolute"
          right="$6"
          bottom={bottom ?? '$6'}
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
          <LucideIcon.Scan color="$grey-100" />
        </YStack>
      )}
      <XStack h="$4" jc="space-between" px="$4" py="$2" border={isScrolledByOffset} borderTopWidth={0}>
        {/* XStack here so the other items are rendered center and right due to flex */}
        <XStack width="$2" />
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
              alignItems="center"
            >
              <Logo source={logo} />
            </XStack>
          )}
        </AnimatePresence>
        <XStack width="$2" alignItems="center">
          <InboxIcon />
        </XStack>
      </XStack>
      {credentials.length === 0 ? (
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
              height={BASE_CREDENTIAL_CARD_HEIGHT + firstThreeRecords.length * CREDENTIAL_TOP_INFO_OFFSET}
            >
              {firstThreeRecords.map((credential, idx) => {
                return (
                  <XStack
                    key={credential.id}
                    mt={CREDENTIAL_TOP_INFO_HEIGHT * idx}
                    br="$8"
                    borderColor="$lightTranslucent"
                    borderWidth={0.5}
                  >
                    <CredentialCard
                      onPress={() => navigateToCredentialDetail(credential.id)}
                      issuerImage={credential.display.issuer.logo}
                      backgroundImage={credential.display.backgroundImage}
                      textColor={credential.display.textColor}
                      name={credential.display.name}
                      issuerName={credential.display.issuer.name}
                      subtitle={credential.display.description}
                      bgColor={credential.display.backgroundColor}
                      shadow={false}
                    />
                  </XStack>
                )
              })}
            </ZStack>
          </YStack>
          <YStack g="md" marginBottom="$8">
            <Heading variant="h3" textAlign="left" secondary>
              Credentials
            </Heading>
            <TableContainer>
              {credentials.map((credential, idx) => {
                return (
                  <CredentialRowCard
                    key={credential.id}
                    name={credential.display.name}
                    issuer={credential.display.issuer.name}
                    bgColor={credential.display.backgroundColor}
                    onPress={() => navigateToCredentialDetail(credential.id)}
                    hideBorder={credentials.length === 1 || idx === credentials.length - 1}
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
