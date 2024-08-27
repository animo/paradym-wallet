import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons } from '../content'

export function WelcomePopup({ bottom, onClose }: { bottom: number; onClose: () => void }) {
  return (
    <YStack ai="center" position="absolute" width="100%" zIndex={5} bottom={bottom + 96} onPress={onClose}>
      <Animated.View
        entering={FadeInDown.delay(1000).springify().mass(0.8).damping(10).stiffness(120)}
        exiting={FadeOutDown.springify().mass(0.8).damping(10).stiffness(120)}
      >
        <YStack ai="center" width="100%">
          <Stack bg="$grey-900" gap="$2" maxWidth="80%" br="$8" p="$4">
            <XStack jc="space-between">
              <Heading color="$white" variant="h4" fontWeight="$semiBold">
                Welcome to your wallet
              </Heading>
              <Stack p="$2" m={-6}>
                <HeroIcons.X color="$white" size={20} />
              </Stack>
            </XStack>
            <Paragraph variant="sub" ta="center" color="$white">
              Scan a QR code to start an interaction.
            </Paragraph>
          </Stack>
          <Stack
            bbc="$grey-900"
            h="$3"
            w="$3"
            blw="$4"
            brw="$4"
            blc="transparent"
            brc="transparent"
            bbw="$5"
            rotate="180deg"
            mt={-8}
          />
        </YStack>
      </Animated.View>
    </YStack>
  )
}
