import { getCredentialForDisplay, useW3cCredentialRecords } from '@internal/agent'
import {
  Button,
  Heading,
  Icon,
  Page,
  Paragraph,
  ScrollView,
  Spinner,
  TableContainer,
  XStack,
  YStack,
  ZStack,
  BASE_CREDENTIAL_CARD_HEIGHT,
  CREDENTIAL_TOP_INFO_OFFSET,
  CREDENTIAL_TOP_INFO_HEIGHT,
} from '@internal/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import CredentialCard from 'app/components/CredentialCard'
import CredentialRowCard from 'app/components/CredentialRowCard'

export function WalletScreen() {
  const { push } = useRouter()
  const { w3cCredentialRecords, isLoading } = useW3cCredentialRecords()
  const firstThreeRecords = w3cCredentialRecords.slice(0, 3)

  if (isLoading) {
    return (
      <Page jc="center" ai="center">
        <Spinner />
      </Page>
    )
  }

  if (w3cCredentialRecords.length === 0) {
    return (
      <Page justifyContent="center" alignItems="center">
        <Heading variant="h2">This is your Wallet.</Heading>
        <Paragraph textAlign="center" secondary>
          Credentials will be shown here.
        </Paragraph>
        <Button.Text onPress={() => push('/scan')}>Scan a QR code</Button.Text>
      </Page>
    )
  }

  const navigateToCredentialDetail = (id: string) => push(`/credentials/${id}`)
  const navigateToScanner = () => push('/scan')

  return (
    <ScrollView>
      <YStack jc="center" space pad="lg" pb="$10">
        <XStack jc="space-between" ai="center">
          <Heading variant="title" textAlign="left">
            Wallet
          </Heading>
          <XStack onPress={() => navigateToScanner()} pad="md">
            <Icon name="Scan" />
          </XStack>
        </XStack>
        <YStack g="lg" width="100%">
          <Heading variant="h3" textAlign="left">
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
        <Heading variant="h3" textAlign="left">
          Credentials
        </Heading>
        <TableContainer padY="$2">
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
    </ScrollView>
  )
}
