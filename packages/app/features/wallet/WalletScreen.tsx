import { getCredentialForDisplay, useW3cCredentialRecords } from '@internal/agent'
import {
  Heading,
  Page,
  ScrollView,
  Spinner,
  TableContainer,
  XStack,
  YStack,
  Scan,
  AnimatePresence,
  Paragraph,
  HEADER_TITLE_TEXT_HEIGHT,
} from '@internal/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import CredentialRowCard from 'app/components/CredentialRowCard'
import NoContentWallet from 'app/components/NoContentWallet'
import { useNetworkCallback } from 'app/hooks/useNetworkCallback'
import useScrollViewPosition from 'app/hooks/useScrollViewPosition'

export function WalletScreen() {
  const { push } = useRouter()
  const { w3cCredentialRecords, isLoading } = useW3cCredentialRecords()
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
    <YStack bg="$grey-200">
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
              Credentials
            </Paragraph>
          )}
        </AnimatePresence>
      </XStack>
      {w3cCredentialRecords.length === 0 ? (
        <NoContentWallet />
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle} space px="$4">
          <XStack jc="space-between" ai="center">
            <Heading variant="title" textAlign="left">
              Credentials
            </Heading>
            <XStack onPress={() => navigateToScanner()} pad="md">
              <Scan />
            </XStack>
          </XStack>
          <YStack pt="$2" pb="$12">
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
