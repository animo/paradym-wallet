import { FlexPage, HeaderContainer, InfoButton, Paragraph, YStack } from '@package/ui'
import React from 'react'

import { TextBackButton } from 'packages/app'
import { Linking } from 'react-native'

import { useIsFunkeWallet } from '@easypid/hooks/useFeatureFlag'
import pj from '../../../package.json'

const TEXT_FUNKE = `This app was created by Animo Solutions in the context of the SPRIN-D Funke ‘EUDI Wallet Prototypes’. It
            serves as a prototype for future wallet providers. All code is available under Apache 2.0.`

const TEXT_PARADYM =
  'This app was created by Animo Solutions as a companion app for Paradym. All code is available under Apache 2.0.'

export function FunkeAboutScreen() {
  const isFunkeWallet = useIsFunkeWallet()

  const openContact = () => {
    Linking.openURL(
      `mailto:ana@animo.id?subject=Reach out from ${isFunkeWallet ? 'Funke EUDI Wallet' : 'Paradym Wallet'}`
    )
  }

  const openPrivacyPolicy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer title="About the wallet" />
      <YStack fg={1} px="$4" gap="$4">
        <YStack gap="$2">
          <Paragraph color="$grey-700">{isFunkeWallet ? TEXT_FUNKE : TEXT_PARADYM}</Paragraph>
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
