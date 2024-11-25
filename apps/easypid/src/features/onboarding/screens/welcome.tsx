import { Button, FlexPage, Heading, HeroIcons, IconContainer, Paragraph, Stack, XStack, YStack } from '@package/ui'
import { Image } from '@tamagui/image'
import type React from 'react'
import { Alert, Dimensions } from 'react-native'

import welcomeBackground from '../../../../assets/home-bg.png'

export interface OnboardingWelcomeProps {
  goToNextStep: () => void
}

export default function OnboardingWelcome({ goToNextStep }: OnboardingWelcomeProps) {
  return (
    <YStack fg={1} pos="relative">
      <Image
        pos="absolute"
        source={welcomeBackground}
        resizeMode="cover"
        h={Dimensions.get('window').height / 2}
        mt="$-4"
        w="100%"
        top={0}
      />
      <FlexPage safeArea="y" p={0} fg={1} jc="space-between" backgroundColor="$transparent">
        <YStack px="$4" gap="$4" flex-1 justifyContent="space-between">
          <YStack ai="flex-end">
            <IconContainer
              aria-label="Info"
              icon={<HeroIcons.QuestionMarkCircle />}
              p="$2"
              onPress={() => {
                Alert.alert(
                  'This is the EasyPID wallet',
                  '\nThis is your digital wallet. With it, you can store and share information about yourself.'
                )
              }}
            />
          </YStack>
          <Stack h="$10" />
          <YStack gap="$4" jc="center" ai="center">
            <Heading fontSize={32}>Animo EasyPID</Heading>
            <Paragraph px="$2" ta="center">
              This is your digital wallet. With it, you can store and share information about yourself.
            </Paragraph>
          </YStack>
          <XStack gap="$2">
            <Button.Solid flexGrow={1} onPress={goToNextStep}>
              Get Started
            </Button.Solid>
          </XStack>
        </YStack>
      </FlexPage>
    </YStack>
  )
}
