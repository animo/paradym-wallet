import { getCredentialForDisplay, useW3cCredentialRecords } from '@internal/agent'
import {
  AnimatePresence,
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
} from '@internal/ui'
import { useRouter } from 'solito/router'

import { CredentialCarousel } from 'app/components/CredentialCarousel'
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
    <YStack bg="$grey-200" height="100%">
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
        <XStack
          pos="absolute"
          right={0}
          mt="$-2"
          mr="$3"
          onPress={() => navigateToScanner()}
          pad="md"
        >
          <Scan />
        </XStack>
      </XStack>
      {w3cCredentialRecords.length === 0 ? (
        <NoContentWallet />
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle} space>
          <YStack g="md" pt="$2" px="$4">
            <Heading variant="h3" textAlign="left" secondary>
              Recently added
            </Heading>
            <CredentialCarousel credentials={firstThreeRecords} />
          </YStack>
          <YStack g="md" pt="$2" pb="$12">
            <Heading variant="h3" textAlign="left" secondary px="$4">
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
