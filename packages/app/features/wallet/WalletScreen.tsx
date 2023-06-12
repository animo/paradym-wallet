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
} from '@internal/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import CredentialCard from 'app/components/CredentialCard'
import CredentialRowCard from 'app/components/CredentialRowCard'
import NoContentWallet from 'app/components/NoContentWallet'
import useBorderScroll from 'app/hooks/useBorderScroll'

export function WalletScreen() {
  const { push } = useRouter()
  const { w3cCredentialRecords, isLoading } = useW3cCredentialRecords()
  const firstThreeRecords = w3cCredentialRecords.slice(0, 3)
  const { handleScroll, isBorderActive, scrollEventThrottle } = useBorderScroll()

  if (isLoading) {
    return (
      <Page jc="center" ai="center">
        <Spinner />
      </Page>
    )
  }

  const navigateToCredentialDetail = (id: string) => push(`/credentials/${id}`)
  const navigateToScanner = () => push('/scan')

  return (
    <YStack>
      <XStack pad="lg" jc="space-between" ai="center" border={isBorderActive} borderTopWidth={0}>
        <Heading variant="title" textAlign="left">
          Wallet
        </Heading>
        <XStack onPress={() => navigateToScanner()} pad="md">
          <Scan />
        </XStack>
      </XStack>
      <ScrollView
        scrollEventThrottle={scrollEventThrottle}
        onScroll={handleScroll}
        space
        px="$4"
        contentContainerStyle={{
          minHeight: '100%',
        }}
      >
        {w3cCredentialRecords.length === 0 ? (
          <NoContentWallet />
        ) : (
          <YStack pb="$12">
            <YStack g="md" width="100%">
              <Heading variant="h2" textAlign="left" secondary>
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
                        iconUrl={display.issuer?.logo?.url}
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
              <Heading variant="h2" textAlign="left" secondary>
                Credentials
              </Heading>
              <TableContainer>
                {w3cCredentialRecords.map((credentialRecord) => {
                  const { display } = getCredentialForDisplay(credentialRecord)
                  return (
                    <CredentialRowCard
                      key={credentialRecord.id}
                      name={display.name}
                      issuer={display.issuer.name}
                      bgColor={display.backgroundColor}
                      onPress={() => navigateToCredentialDetail(credentialRecord.id)}
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
