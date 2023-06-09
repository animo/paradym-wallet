import {
  dbcPresentationDefinition,
  getCredentialForDisplay,
  multipleCredentialPresentationDefinition,
  presentationExchangeService,
  useAgent,
  useW3cCredentialRecords,
} from '@internal/agent'
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
import React, { useEffect } from 'react'
import { useRouter } from 'solito/router'

import CredentialCard from 'app/components/CredentialCard'
import CredentialRowCard from 'app/components/CredentialRowCard'
import NoContentWallet from 'app/components/NoContentWallet'

export function WalletScreen() {
  const { push } = useRouter()
  const { w3cCredentialRecords, isLoading } = useW3cCredentialRecords()
  const firstThreeRecords = w3cCredentialRecords.slice(0, 3)
  const { agent } = useAgent()

  // NOTE: Example selection of credentials
  useEffect(() => {
    void presentationExchangeService
      .selectCredentialsForRequest(agent.context, multipleCredentialPresentationDefinition)
      .then((selectedCredentials) => {
        console.log(JSON.stringify(selectedCredentials, null, 2))
      })

    void presentationExchangeService
      .selectCredentialsForRequest(agent.context, dbcPresentationDefinition)
      .then((selectedCredentials) => {
        console.log(JSON.stringify(selectedCredentials, null, 2))
      })
  }, [])

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
    <ScrollView
      fullscreen
      space
      p="$4"
      contentContainerStyle={{
        minHeight: '100%',
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
          <YStack g="md">
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
        </YStack>
      )}
    </ScrollView>
  )
}
