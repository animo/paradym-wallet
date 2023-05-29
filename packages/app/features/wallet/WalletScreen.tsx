import type { MattrW3cCredentialRecord } from '@internal/agent/types'

import { useW3cCredentialRecords } from '@internal/agent'
import {
  Heading,
  Page,
  Paragraph,
  ScrollView,
  Spinner,
  TableContainer,
  XStack,
  YStack,
  ZStack,
  borderRadiusSizes,
  paddingSizes,
} from '@internal/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import CredentialCard from 'app/components/CredentialCard'
import CredentialRowCard from 'app/components/CredentialRowCard'

export function HomeScreen() {
  const { push } = useRouter()
  const { w3cCredentialRecords, isLoading } = useW3cCredentialRecords()

  const records = w3cCredentialRecords as unknown as MattrW3cCredentialRecord[]

  if (isLoading) {
    return (
      <Page jc="center" ai="center">
        <Spinner />
      </Page>
    )
  }

  if (records.length === 0) {
    return (
      <Page justifyContent="center" alignItems="center">
        <Heading variant="h2">This is your Wallet.</Heading>
        <Paragraph textAlign="center" secondary>
          Credentials will be shown here.
        </Paragraph>
      </Page>
    )
  }

  return (
    <ScrollView>
      <YStack jc="center" space pad="lg">
        <Heading variant="title" textAlign="left" pt="$8">
          Wallet
        </Heading>
        <YStack g="lg" width="100%">
          <Heading variant="h3" textAlign="left">
            Recently added
          </Heading>
          <ZStack f={0} flexBasis="auto" height={352}>
            {records.slice(0, 3).map((x, idx) => {
              const credential = x.credential
              return (
                <XStack
                  key={x.id}
                  mt={72 * idx}
                  onPress={() => push(`/credentials/${x.id ?? ''}`)}
                  br={borderRadiusSizes.xl}
                  borderColor="$lightTranslucent"
                  borderWidth={0.5}
                >
                  <CredentialCard
                    iconUrl={credential.issuer.iconUrl}
                    name={credential.name}
                    issuerName={credential.issuer.name}
                    subtitle={credential.description}
                    bgColor={credential?.credentialBranding?.backgroundColor}
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
        <TableContainer padY={paddingSizes.xs}>
          {records.slice(3).map((x) => {
            return (
              <CredentialRowCard
                key={x.id}
                name={x.credential.name}
                issuer={x.credential.issuer.name}
                bgColor={x.credential.credentialBranding?.backgroundColor}
                onPress={() => push(`/credentials/${x.id ?? ''}`)}
              />
            )
          })}
        </TableContainer>
      </YStack>
    </ScrollView>
  )
}
