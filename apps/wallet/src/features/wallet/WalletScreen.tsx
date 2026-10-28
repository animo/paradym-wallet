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

  const home = (
    <>
      <XStack pt="$2" jc="space-between">
        <IconContainer bg="white" aria-label="Menu" icon={<HeroIcons.Menu />} onPress={pushToMenu} />
        <InboxIcon />
      </XStack>

      <AnimatedStack fg={1} entering={useSpringify(FadeIn, 200)}>
        <ScrollView scrollEnabled={false} contentContainerStyle={{ fg: 1 }}>
          <YStack fg={1} f={1} gap="$4">
            <YStack ai="center" jc="center" gap="$2">
              <Heading heading="h1" fontSize={38} lineHeight={40} ta="center" numberOfLines={2}>
                <Trans id="home.helloWithoutName">Hello!</Trans>
              </Heading>
              <Paragraph>
                <Trans id="home.receiveOrShare">Receive or share from your wallet</Trans>{' '}
              </Paragraph>
            </YStack>
            <XStack gap="$4" jc="center" py="$2" w="95%" mx="auto">
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

            <Stack h="$4" />
          </YStack>
          <YStack gap="$4" jc="space-around" fg={1} f={1}>
            <YStack gap="$4">
              <LatestActivityCard />
              <AllCardsCard />
            </YStack>
            <Spacer />
          </YStack>
        </ScrollView>
      </AnimatedStack>
    </>
  )

  return (
    <YStack pos="relative" fg={1} bg="$background">
      <YStack pos="absolute" h="50%" w={media.wide ? width / 2 : '100%'}>
        <Blob />
      </YStack>

      {media.wide ? (
        // Wide windows show the cards next to the home screen
        <FlexPage fg={1} flex-1={false} bg="transparent" maxWidth="100%" px="$0" gap="$0">
          <TwoPane
            start={
              <YStack f={1} px="$4" gap="$6">
                {home}
              </YStack>
            }
            end={<HomeCredentialList onSelect={pushToCredential} />}
          />
        </FlexPage>
      ) : (
        <FlexPage fg={1} flex-1={false} bg="transparent">
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
