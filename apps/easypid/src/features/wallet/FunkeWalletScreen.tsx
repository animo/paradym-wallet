import { useFirstNameFromPidCredential } from '@easypid/hooks'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { Trans, useLingui } from '@lingui/react/macro'
import { useRefreshedDeferredCredentials } from '@package/agent'
import { useHaptics } from '@package/app/hooks'
import {
  AnimatedStack,
  Blob,
  Button,
  CustomIcons,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  Paragraph,
  ScrollView,
  Spacer,
  Stack,
  useSpringify,
  XStack,
  YStack,
} from '@package/ui'
import { useRouter } from 'expo-router'
import { FadeIn } from 'react-native-reanimated'
import { ActionCard } from './components/ActionCard'
import { AllCardsCard } from './components/AllCardsCard'
import { InboxIcon } from './components/InboxIcon'
import { LatestActivityCard } from './components/LatestActivityCard'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()
  const { userName, isLoading } = useFirstNameFromPidCredential()
  const hasEidCardFeatureFlag = useFeatureFlag('EID_CARD')

  const pushToMenu = withHaptics(() => push('/menu'))
  const pushToScanner = withHaptics(() => push('/scan'))
  const pushToPidSetup = withHaptics(() => push('/pidSetup'))
  const pushToAbout = withHaptics(() => push('/menu/about'))
  const pushToOffline = () => {
    withHaptics(() => push('/offline'))()
  }
  const { t } = useLingui()

  useRefreshedDeferredCredentials()

  return (
    <YStack pos="relative" fg={1} bg="$background">
      <YStack pos="absolute" h="50%" w="100%">
        <Blob />
      </YStack>

      <FlexPage fg={1} flex-1={false} bg="transparent">
        <XStack pt="$2" jc="space-between">
          <IconContainer bg="white" aria-label="Menu" icon={<HeroIcons.Menu />} onPress={pushToMenu} />
          <InboxIcon />
        </XStack>

        <AnimatedStack fg={1} entering={useSpringify(FadeIn, 200)}>
          <ScrollView scrollEnabled={false} contentContainerStyle={{ fg: 1 }}>
            <YStack fg={1} f={1} gap="$4">
              <YStack ai="center" jc="center" gap="$2">
                <Heading
                  heading="h1"
                  fontSize={userName.length < 14 ? 38 : 26}
                  lineHeight={userName.length < 14 ? 40 : 32}
                  opacity={isLoading ? 0 : 1}
                  ta="center"
                  numberOfLines={2}
                >
                  {userName ? (
                    <Trans id="home.helloWithName">Hello, {userName}!</Trans>
                  ) : (
                    <Trans id="home.helloWithoutName">Hello!</Trans>
                  )}
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

              {hasEidCardFeatureFlag ? (
                <XStack ai="center" opacity={isLoading ? 0 : 1}>
                  {userName ? (
                    <Button.Text scaleOnPress bg="transparent" onPress={pushToAbout}>
                      {t({
                        id: 'home.howDoesItWork',
                        message: 'How does it work?',
                      })}
                    </Button.Text>
                  ) : (
                    <Button.Text scaleOnPress bg="transparent" onPress={pushToPidSetup}>
                      {t({
                        id: 'home.setupYourId',
                        message: 'Setup your ID',
                      })}{' '}
                      <HeroIcons.ArrowRight ml="$-2.5" color="$primary-500" size={16} />
                    </Button.Text>
                  )}
                </XStack>
              ) : (
                <Stack h="$4" />
              )}
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
      </FlexPage>
    </YStack>
  )
}
