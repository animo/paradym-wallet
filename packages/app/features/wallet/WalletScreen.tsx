import { getCredentialForDisplay, useW3cCredentialRecords } from '@internal/agent'
import {
  Heading,
  Page,
  ScrollView,
  Spinner,
  TableContainer,
  XStack,
  YStack,
  ZStack,
  BASE_CREDENTIAL_CARD_HEIGHT,
  CREDENTIAL_TOP_INFO_OFFSET,
  CREDENTIAL_TOP_INFO_HEIGHT,
  Scan,
  AnimatePresence,
  Paragraph,
  HEADER_TITLE_TEXT_HEIGHT,
} from '@internal/ui'
import React from 'react'
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
    <YStack>
      <XStack h="$2.5" jc="center" border={isScrolledByOffset} borderTopWidth={0}>
        <AnimatePresence>
          {isScrolledByOffset && (
            <Paragraph
              key="wallet-mini-header"
              textAlign="center"
              enterStyle={{ opacity: 0, y: -30 }}
              exitStyle={{ opacity: 0, y: -30 }}
              y={0}
              opacity={1}
              animation="normal"
            >
              Wallet
            </Paragraph>
          )}
        </AnimatePresence>
      </XStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        space
        px="$4"
        contentContainerStyle={{
          minHeight: '90%',
        }}
      >
        <XStack jc="space-between" ai="center">
          <Heading variant="title" textAlign="left">
            Wallet
          </Heading>
          <XStack onPress={() => navigateToScanner()} pad="md">
            <Scan />
          </XStack>
        </XStack>
        {w3cCredentialRecords.length === 0 ? (
          <NoContentWallet />
        ) : (
          <YStack pb="$12">
            <YStack g="md" width="100%">
              <Heading variant="h3" textAlign="left" secondary>
                Recently added
              </Heading>
              <ZStack
                f={0}
                flexBasis="auto"
                height={
                  BASE_CREDENTIAL_CARD_HEIGHT +
                  firstThreeRecords.length * CREDENTIAL_TOP_INFO_OFFSET
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
          </YStack>
        )}
      </ScrollView>
    </YStack>
  )
}
