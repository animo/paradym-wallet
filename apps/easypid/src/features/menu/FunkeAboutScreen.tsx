import { useAppCopy } from '@easypid/config/copy'
import { useLingui } from '@lingui/react/macro'
import { TextBackButton } from '@package/app'
import { FlexPage, HeaderContainer, InfoButton, Paragraph, YStack } from '@package/ui'
import * as Application from 'expo-application'
import { Linking } from 'react-native'

export function FunkeAboutScreen() {
  const { t } = useLingui()
  const { about } = useAppCopy()

  const openContact = () => {
    Linking.openURL(`mailto:ana@animo.id?subject=${about.emailHeader}`)
  }

  const openPrivacyPolicy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer
        title={t({
          id: 'funkeAboutScreen.header',
          message: 'About the wallet',
          comment: 'Screen header shown on the about page of the wallet',
        })}
      />
      <YStack fg={1} px="$4" gap="$4">
        <YStack gap="$2">
          <Paragraph color="$grey-700">{t(about.description)}</Paragraph>
          <Paragraph>
            {t({
              id: 'funkeAboutScreen.contactIntro',
              message: 'For more information, reach out to',
              comment: 'Intro sentence before showing support email address',
            })}{' '}
            <Paragraph fontWeight="$semiBold" color="$primary-500" onPress={openContact}>
              ana@animo.id
            </Paragraph>
            .
          </Paragraph>
        </YStack>
        <YStack gap="$2" fg={1} jc="space-between">
          <InfoButton
            variant="view"
            title={t({
              id: 'funkeAboutScreen.privacyPolicyTitle',
              message: 'Privacy Policy',
              comment: 'Label for button that opens the privacy policy',
            })}
            description={t({
              id: 'funkeAboutScreen.privacyPolicyDescription',
              message: 'Open the privacy policy',
              comment: 'Description under the privacy policy button',
            })}
            routingType="external"
            onPress={openPrivacyPolicy}
          />
          <Paragraph py="$4" mx="auto" variant="sub" fontSize={13} fontWeight="$medium">
            {Application.applicationName} {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
          </Paragraph>
        </YStack>
      </YStack>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
