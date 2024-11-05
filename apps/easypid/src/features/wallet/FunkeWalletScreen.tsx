import {
  AnimatedStack,
  BASE_CREDENTIAL_CARD_HEIGHT,
  Button,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  Loader,
  LucideIcons,
  Paragraph,
  ScrollView,
  Spacer,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'
import { useRouter } from 'expo-router'

import { useCredentialsWithCustomDisplay } from '@easypid/hooks/useCredentialsWithCustomDisplay'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { useHaptics, useNetworkCallback } from '@package/app/src/hooks'
import type { CredentialDisplay } from 'packages/agent/src'
import { FunkeCredentialCard } from 'packages/app'
import { FadeIn, FadeInDown, LinearTransition, ZoomIn, useAnimatedStyle } from 'react-native-reanimated'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const { isLoading, credentials } = useCredentialsWithCustomDisplay()
  const onResetWallet = useWalletReset()
  const { withHaptics } = useHaptics()

  const pushToMenu = withHaptics(() => push('/menu'))
  const pushToActivity = withHaptics(() => push('/activity'))
  const pushToScanner = withHaptics(() => push('/scan'))

  const {
    pressStyle: qrPressStyle,
    handlePressIn: qrHandlePressIn,
    handlePressOut: qrHandlePressOut,
  } = useScaleAnimation({ scaleInValue: 0.95 })

  return (
    <FlexPage p={0} safeArea="b" gap={0}>
      <AnimatedStack entering={FadeIn.duration(200)}>
        <XStack px="$4" py="$2" ai="center" justifyContent="space-between">
          <IconContainer icon={<HeroIcons.Menu />} onPress={pushToMenu} />
          <IconContainer icon={<LucideIcons.History />} onPress={pushToActivity} />
        </XStack>
        <Stack alignItems="center" gap="$2" py="$6" px="$4" borderBottomWidth="$0.5" borderColor="$grey-200">
          <AnimatedStack
            flexDirection="column"
            style={qrPressStyle}
            onPressIn={qrHandlePressIn}
            onPressOut={qrHandlePressOut}
            onPress={useNetworkCallback(pushToScanner)}
            bg="#2A337E1A"
            br="$12"
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
          <Paragraph fontWeight="$bold" color="$primary-500">
            Scan QR-Code
          </Paragraph>
        </Stack>
      </AnimatedStack>
      {credentials.length === 0 ? (
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
              flexDirection="row"
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
        <ScrollView p="$4" py="$7" gap="$2">
          <AnimatedStack position="relative" mb={BASE_CREDENTIAL_CARD_HEIGHT + credentials.length * 72}>
            {credentials.map((credential, idx) => (
              <AnimatedCredentialCard key={credential.id} display={credential.display} id={credential.id} index={idx} />
            ))}
          </AnimatedStack>
        </ScrollView>
      )}
      <AnimatedStack entering={FadeIn.delay(700)} flexDirection="column" gap="$1" ai="center" jc="center" opacity={0.8}>
        <Paragraph pt="$4" variant="sub" fontSize={13} fontWeight="$medium" ta="center" px="$4">
          Learn more about{' '}
          <Paragraph
            onPress={() => push('/menu/about')}
            variant="annotation"
            fontSize={13}
            fontWeight="$semiBold"
            color="$primary-500"
          >
            using this wallet
          </Paragraph>
          .
        </Paragraph>
      </AnimatedStack>
    </FlexPage>
  )
}

function AnimatedCredentialCard({
  display,
  id,
  index,
}: {
  display: CredentialDisplay
  id: string
  index: number
}) {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()

  const animatedStyle = useAnimatedStyle(() => {
    const baseMargin = index * 72

    return {
      marginTop: baseMargin,
    }
  })

  return (
    <AnimatedStack
      position="absolute"
      width="100%"
      style={animatedStyle}
      layout={LinearTransition.duration(300).springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05)}
    >
      <FunkeCredentialCard
        issuerImage={display.issuer.logo}
        backgroundImage={display.backgroundImage}
        textColor={display.textColor}
        name={display.name}
        bgColor={display.backgroundColor}
        shadow={false}
        onPress={withHaptics(() => push(`/credentials/${id}`))}
      />
    </AnimatedStack>
  )
}
