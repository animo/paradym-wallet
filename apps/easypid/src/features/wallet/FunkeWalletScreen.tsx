import {
  AnimatedStack,
  Button,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  Loader,
  Paragraph,
  ScrollView,
  Spacer,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'
import { useRouter } from 'solito/router'

import { useCredentialsWithCustomDisplay } from '@easypid/hooks/useCredentialsWithCustomDisplay'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { useHaptics, useNetworkCallback, useScrollViewPosition } from '@package/app/src/hooks'
import { FunkeCredentialCard } from 'packages/app'
import { useState } from 'react'
import { FadeInDown, ZoomIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MdocQrCode } from '../proximity'
import { LatestActivityCard } from './components/LatestActivityCard'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const { isLoading, credentials } = useCredentialsWithCustomDisplay()
  const onResetWallet = useWalletReset()
  const { withHaptics } = useHaptics()

  const pushToMenu = withHaptics(() => push('/menu'))
  const pushToScanner = withHaptics(() => push('/scan'))
  const pushToCards = withHaptics(() => push('/credentials'))

  const {
    pressStyle: qrPressStyle,
    handlePressIn: qrHandlePressIn,
    handlePressOut: qrHandlePressOut,
  } = useScaleAnimation({ scaleInValue: 0.95 })

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

  return (
    <FlexPage p={0} safeArea={false} gap={0}>
      {/* Header */}
      <XStack
        px="$4"
        py="$2"
        pb="$4"
        ai="center"
        justifyContent="space-between"
        bbw="$0.5"
        borderColor={isScrolledByOffset ? '$grey-200' : '$background'}
      >
        <IconContainer aria-label="Menu" icon={<HeroIcons.Menu />} onPress={pushToMenu} />
      </XStack>

      {/* Body */}
      <ScrollView
        scrollEnabled={credentials.length > 0}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        px="$4"
        onLayout={(e) => {
          setScrollViewHeight(e.nativeEvent.layout.height)
        }}
        contentContainerStyle={{
          minHeight: credentials.length <= 1 ? scrollViewHeight : '100%',
          justifyContent: 'space-between',
          paddingBottom: bottom,
        }}
      >
        <YStack fg={1}>
          <Stack accessible={true} alignItems="center" pt="$6" pb="$4">
            <AnimatedStack
              flexDirection="column"
              style={qrPressStyle}
              onPressIn={qrHandlePressIn}
              onPressOut={qrHandlePressOut}
              bg="#2A337E1A"
              br="$12"
              onPress={useNetworkCallback(pushToScanner)}
            >
              <Stack
                bg="$primary-500"
                br="$12"
                p="$4"
                m="$2.5"
                shadowOffset={{ width: 0, height: 2 }}
                shadowColor="$grey-600"
                shadowOpacity={0.3}
                shadowRadius={5}
              >
                <HeroIcons.QrCode strokeWidth={1.5} color="$white" size={48} />
              </Stack>
            </AnimatedStack>
            <Button.Text scaleOnPress fontWeight="$bold" onPress={useNetworkCallback(pushToScanner)}>
              Scan QR-Code
            </Button.Text>
          </Stack>
          <MdocQrCode />
          {credentials.length === 0 && !isLoading ? (
            <AnimatedStack
              entering={FadeInDown.delay(300).springify().mass(1).damping(16).stiffness(140).restSpeedThreshold(0.1)}
              ai="center"
              gap="$4"
              p="$4"
              fg={1}
              mt="$10"
            >
              <YStack gap="$2">
                <Heading ta="center" variant="h3" fontWeight="$semiBold">
                  There's nothing here, yet
                </Heading>
                <Paragraph ta="center">Setup your ID or use the QR scanner to receive credentials.</Paragraph>
              </YStack>
              <AnimatedStack
                entering={ZoomIn.delay(500).springify().mass(1).damping(16).stiffness(140).restSpeedThreshold(0.1)}
              >
                <Button.Solid
                  h="$3.5"
                  px="$5"
                  br="$12"
                  bg="$grey-100"
                  color="$grey-900"
                  onPress={onResetWallet}
                  scaleOnPress
                >
                  Setup ID
                </Button.Solid>
              </AnimatedStack>
            </AnimatedStack>
          ) : isLoading ? (
            <YStack ai="center" jc="center" fg={1}>
              <Loader />
              <Spacer size="$12" />
            </YStack>
          ) : (
            <Stack gap="$6">
              <LatestActivityCard />
              <YStack gap="$4">
                <Heading px="$2" variant="sub2">
                  Recently used
                </Heading>
                <Stack gap="$4">
                  {credentials.slice(0, 2).map((credential) => (
                    <FunkeCredentialCard
                      key={credential.id}
                      issuerImage={credential.display.issuer.logo}
                      backgroundImage={credential.display.backgroundImage}
                      textColor={credential.display.textColor}
                      name={credential.display.name}
                      bgColor={credential.display.backgroundColor}
                      shadow={false}
                      onPress={withHaptics(() => push(`/credentials/${credential.id}`))}
                    />
                  ))}
                </Stack>
                {credentials.length > 2 && (
                  <Button.Solid
                    bw="$0.5"
                    borderColor="$grey-100"
                    bg="$grey-50"
                    color="$grey-900"
                    onPress={pushToCards}
                    scaleOnPress
                  >
                    See all cards
                    <HeroIcons.ArrowRight size={20} color="$grey-500" />
                  </Button.Solid>
                )}
              </YStack>
            </Stack>
          )}
        </YStack>
        <Spacer h="$3" />
        <XStack flexDirection="column" gap="$1" ai="center" jc="center">
          <Paragraph
            onPress={() => push('/menu/about')}
            variant="sub"
            fontSize={13}
            fontWeight="$medium"
            ta="center"
            px="$4"
          >
            Learn more about{' '}
            <Paragraph variant="annotation" fontSize={13} fontWeight="$semiBold" color="$primary-500">
              using this wallet
            </Paragraph>
            .
          </Paragraph>
        </XStack>
      </ScrollView>
    </FlexPage>
  )
}
