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
import { useRouter } from 'solito/router'

import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { useNetworkCallback } from '@package/app/src/hooks'
import { type CredentialDisplay, useCredentialsForDisplay } from 'packages/agent/src'
import { FunkeCredentialCard } from 'packages/app'
import { FadeIn, FadeInDown, ZoomIn, useAnimatedStyle } from 'react-native-reanimated'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const navigateToScanner = useNetworkCallback(() => push('/scan'))
  const { isLoading, credentials } = useCredentialsForDisplay()
  const onResetWallet = useWalletReset()

  const {
    pressStyle: qrPressStyle,
    handlePressIn: qrHandlePressIn,
    handlePressOut: qrHandlePressOut,
  } = useScaleAnimation({ scaleInValue: 0.95 })

  return (
    <FlexPage p={0} safeArea="b" gap={0}>
      <XStack px="$4" py="$2" ai="center" justifyContent="space-between">
        <IconContainer icon={<HeroIcons.Menu />} onPress={() => push('/menu')} />
        <IconContainer icon={<LucideIcons.History />} onPress={() => push('/activity')} />
      </XStack>
      <AnimatedStack
        style={qrPressStyle}
        onPressIn={qrHandlePressIn}
        onPressOut={qrHandlePressOut}
        onPress={navigateToScanner}
        alignItems="center"
        gap="$2"
        py="$6"
        mx="$4"
        borderBottomWidth="$0.5"
        borderColor="$grey-200"
      >
        <YStack bg="#2A337E1A" br="$12">
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
        </YStack>
        <Paragraph fontWeight="$bold" color="$primary-500">
          Scan QR-Code
        </Paragraph>
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
          <AnimatedStack
            entering={FadeInDown.springify().mass(1).damping(16).stiffness(140).restSpeedThreshold(0.1)}
            position="relative"
            mb={BASE_CREDENTIAL_CARD_HEIGHT + credentials.length * 72}
          >
            {credentials.map((credential, idx) => (
              <AnimatedCredentialCard key={credential.id} display={credential.display} index={idx} />
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
  index,
}: {
  display: CredentialDisplay
  index: number
}) {
  const { push } = useRouter()

  const animatedStyle = useAnimatedStyle(() => {
    const baseMargin = index * 72

    return {
      marginTop: baseMargin,
    }
  })

  return (
    <AnimatedStack position="absolute" width="100%" style={animatedStyle}>
      {display.name === 'Urn:eu.europa.ec.eudi:pid:1' ? (
        <FunkeCredentialCard
          issuerImage={{
            url: 'https://i.imgur.com/0j9sTb8.png',
            altText: 'Logo of German Government',
          }}
          backgroundImage={{
            url: 'https://i.imgur.com/Cvyjzuc.png',
            altText: 'Background Image',
          }}
          textColor="#2F3544"
          name="Personalausweis"
          bgColor="#CCCEBF"
          shadow={false}
          onPress={() => push('/credentials/pid')}
        />
      ) : (
        <FunkeCredentialCard
          issuerImage={display.issuer.logo}
          backgroundImage={display.backgroundImage}
          textColor={display.textColor}
          name={display.name}
          bgColor={display.backgroundColor}
          shadow={false}
        />
      )}
    </AnimatedStack>
  )
}
