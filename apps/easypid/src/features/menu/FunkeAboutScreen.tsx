import { FlexPage, HeaderContainer, InfoButton, Paragraph, YStack } from '@package/ui'
import React from 'react'

import { TextBackButton } from 'packages/app'
import { Linking } from 'react-native'

import { useAppCopy } from '@easypid/config/copy'
import pj from '../../../package.json'

export function FunkeAboutScreen() {
  const { about } = useAppCopy()

  const openContact = () => {
    Linking.openURL(`mailto:ana@animo.id?subject=${about.emailHeader}`)
  }

  const openPrivacyPolicy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer title="About the wallet" />
      <YStack fg={1} px="$4" gap="$4">
        <YStack gap="$2">
          <Paragraph color="$grey-700">{about.description}</Paragraph>
          <Paragraph>
            For more information, reach out to{' '}
            <Paragraph fontWeight="$semiBold" color="$primary-500" onPress={openContact}>
              ana@animo.id
            </Paragraph>
            .
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
            Paradym Wallet version: {pj.version}
          </Paragraph>
        </YStack>
      </YStack>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
