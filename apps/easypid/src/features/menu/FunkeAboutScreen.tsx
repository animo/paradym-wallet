import { FlexPage, Heading, InfoButton, Paragraph, Stack, YStack } from '@package/ui'
import React from 'react'

import { TextBackButton } from 'packages/app'
import { Linking, Platform } from 'react-native'

import pj from '../../../package.json'

export function FunkeAboutScreen() {
  const openContact = () => {
    Linking.openURL('mailto:ana@animo.id?subject=Reach out from Funke EUDI Wallet')
  }

  const openPrivacyPolicy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="h1" fontWeight="$bold">
            About the wallet
          </Heading>
        </YStack>
      </YStack>

      <YStack fg={1} px="$4" gap="$4">
        <YStack gap="$2">
          <Paragraph color="$grey-700">
            This app was created by Animo Solutions in the context of the SPRIN-D Funke ‘EUDI Wallet Prototypes’. It
            serves as a prototype for future wallet providers. All code is available under Apache 2.0.
          </Paragraph>
          <Paragraph>
            For more information on the project visit sprind.org or reach out to{' '}
            <Paragraph fontWeight="$semiBold" color="$primary-500" onPress={openContact}>
              ana@animo.id
            </Paragraph>
          </Paragraph>
        </YStack>
        <YStack gap="$2" fg={1} jc="space-between">
          <InfoButton
            variant="view"
            title="Privacy Policy"
            description="Open the privacy policy"
            routingType="external"
            onPress={openPrivacyPolicy}
          />
          <Paragraph py="$4" mx="auto" variant="sub" fontSize={13} fontWeight="$medium">
            EasyPID version: {pj.version}
          </Paragraph>
        </YStack>
      </YStack>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
