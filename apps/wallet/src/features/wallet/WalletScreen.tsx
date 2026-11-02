import { Trans, useLingui } from '@lingui/react/macro'
import { useHaptics } from '@package/app'
import {
  AnimatedStack,
  Blob,
  CustomIcons,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  Paragraph,
  ScrollView,
  Spacer,
  Stack,
  TwoPane,
  useMedia,
  useSpringify,
  XStack,
  YStack,
} from '@package/ui'
import { type CredentialId, useCredentials, useRefreshedDeferredCredentials } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useWindowDimensions } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { usePasoRenewCredentialMetadata } from '../../hooks/usePasoRenewCredentialMetadata'
import { useRefreshPaymentTransactionStatuses } from '../../hooks/useRefreshPaymentTransactionStatuses'
import { useUpdateSdJwtVcSvgTemplates } from '../../hooks/useUpdateSdJwtVcSvgTemplates'
import { CredentialList } from './CredentialsScreen'
import { ActionCard } from './components/ActionCard'
import { AllCardsCard } from './components/AllCardsCard'
import { InboxIcon } from './components/InboxIcon'
import { LatestActivityCard } from './components/LatestActivityCard'

export function WalletScreen() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()

  const pushToMenu = withHaptics(() => push('/menu'))
  const pushToScanner = withHaptics(() => push('/scan'))
  const pushToCredential = withHaptics((id: CredentialId) => push(`/credentials/${id}`))
  const pushToOffline = () => {
    withHaptics(() => push('/offline'))()
  }
  const { t } = useLingui()
  const media = useMedia()
  const { width } = useWindowDimensions()

  useRefreshedDeferredCredentials()
  useRefreshPaymentTransactionStatuses()
  usePasoRenewCredentialMetadata()
  useUpdateSdJwtVcSvgTemplates()

  const home = (
    <>
      <XStack pt="2" justify="space-between">
        <IconContainer bg="white" aria-label="Menu" icon={<HeroIcons.Menu />} onPress={pushToMenu} />
        <InboxIcon />
      </XStack>

      <AnimatedStack grow={1} entering={useSpringify(FadeIn, 200)}>
        <ScrollView scrollEnabled={false} contentContainerStyle={{ flexGrow: 1 }}>
          <YStack grow={1} flex={1} gap="5">
            <YStack items="center" justify="center" gap="2">
              <Heading heading="h1" fontSize={38} lineHeight="40px" text="center" numberOfLines={2}>
                <Trans id="home.helloWithoutName">Hello!</Trans>
              </Heading>
              <Paragraph>
                <Trans id="home.receiveOrShare">Receive or share from your wallet</Trans>{' '}
              </Paragraph>
            </YStack>
            <XStack gap="5" justify="center" py="2" w="95%" mx="auto">
              <ActionCard
                variant="primary"
                icon={<CustomIcons.Qr color="white" />}
                title={t({ id: 'home.scanQrButton', message: 'Scan QR-code' })}
                onPress={pushToScanner}
              />
              <ActionCard
                variant="secondary"
                icon={<CustomIcons.People size={26} />}
                title={t({ id: 'home.presentInPersonButton', message: 'Present In-person' })}
                onPress={pushToOffline}
              />
            </XStack>

            <Stack h="11" />
          </YStack>
          <YStack gap="5" justify="space-around" grow={1} flex={1}>
            <YStack gap="5">
              <LatestActivityCard />
              <AllCardsCard />
            </YStack>
            <Spacer size="5" />
          </YStack>
        </ScrollView>
      </AnimatedStack>
    </>
  )

  return (
    <YStack position="relative" grow={1} bg="background">
      <YStack position="absolute" h="50%" w={media.wide ? width / 2 : '100%'}>
        <Blob />
      </YStack>

      {media.wide ? (
        // Wide windows show the cards next to the home screen
        <FlexPage grow={1} flex-1={false} bg="transparent" maxWidth="100%" px="0" gap="0">
          <TwoPane
            start={
              <YStack flex={1} px="5" gap="8">
                {home}
              </YStack>
            }
            end={<HomeCredentialList onSelect={pushToCredential} />}
          />
        </FlexPage>
      ) : (
        <FlexPage grow={1} flex-1={false} bg="transparent">
          {home}
        </FlexPage>
      )}
    </YStack>
  )
}

// Its own component, so narrow windows don't read the credentials for a list they don't show
function HomeCredentialList({ onSelect }: { onSelect: (id: CredentialId) => void }) {
  const { credentials, isLoading } = useCredentials()

  return <CredentialList credentials={credentials} isLoading={isLoading} onSelect={onSelect} />
}
