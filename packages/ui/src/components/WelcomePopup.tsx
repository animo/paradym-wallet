import { Trans } from '@lingui/react/macro'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons } from '../content'

export function WelcomePopup({ bottom, onClose }: { bottom: number; onClose: () => void }) {
  return (
    <YStack items="center" position="absolute" width="100%" zIndex={5} bottom={bottom + 96} onPress={onClose}>
      <Animated.View
        entering={FadeInDown.delay(1000).springify().mass(0.8).damping(10).stiffness(120)}
        exiting={FadeOutDown.springify().mass(0.8).damping(10).stiffness(120)}
      >
        <YStack items="center" width="100%">
          <Stack bg="grey-900" gap="2" maxWidth="80%" rounded="8" p="5">
            <XStack justify="space-between">
              <Heading color="white" heading="h4" fontWeight="semiBold">
                <Trans id="welcome.titleToYourWallet" comment="Welcome title in wallet screen">
                  Welcome to your wallet
                </Trans>
              </Heading>
              <Stack p="2" m={-6}>
                <HeroIcons.X color="white" size={20} />
              </Stack>
            </XStack>
            <Paragraph variant="sub" text="center" color="white">
              <Trans id="welcome.scanAQrCode" comment="Subtitle prompting user to scan a QR code">
                Scan a QR code to start an interaction.
              </Trans>
            </Paragraph>
          </Stack>
          <Stack
            borderBottomColor="grey-900"
            h="9"
            w="9"
            rotate="180deg"
            mt={-8}
            borderLeftWidth={18}
            borderRightWidth={18}
            borderLeftColor="transparent"
            borderRightColor="transparent"
            borderBottomWidth={24}
          />
        </YStack>
      </Animated.View>
    </YStack>
  )
}
