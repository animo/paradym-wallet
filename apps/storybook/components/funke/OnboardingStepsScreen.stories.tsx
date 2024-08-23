import { Button, Heading, HeroIcons, Page, Paragraph, Stack, XStack, YStack } from '@package/ui'
import { OnboardingScreensHeader } from '@package/ui/src/components/ProgressHeader'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

interface OnboardingStepItemProps {
  stepName: string
  description: string
  title: string
  icon: JSX.Element
}

const OnboardingStepItem = ({ stepName, title, description, icon }: OnboardingStepItemProps) => {
  return (
    <XStack gap="$3" flex-1>
      <Stack
        backgroundColor="$primary-500"
        width={36}
        height={36}
        borderRadius={500}
        justifyContent="center"
        alignItems="center"
      >
        {icon}
      </Stack>
      <YStack gap="$2" flex-1>
        <Paragraph variant="sub" textTransform="uppercase">
          {stepName}
        </Paragraph>
        <Heading variant="h2">{title}</Heading>
        <Paragraph variant="text" size="$3" fontWeight="$regular">
          {description}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

const OnboardingStepsScreen = () => {
  return (
    <Page flex-1 gap="$6" justifyContent="space-around">
      <OnboardingScreensHeader
        progress={0}
        title="Setup digital identity"
        subtitle="To setup your digital identity we'll follow the following steps:"
      />
      <YStack flex-1 gap="$2">
        <OnboardingStepItem
          stepName="step 1"
          title="Setup a pin code for the app"
          description="This code will secure the EasyPID wallet and should be kept to yourself."
          icon={<HeroIcons.Key color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 2"
          title="Scan your physical passport"
          description="You'll need to validate your passport using it's pin."
          icon={<HeroIcons.Identification color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 3"
          title="Claim your digital identity"
          description="Complete the setup and learn how to use the app."
          icon={<HeroIcons.Star color="$white" size={20} />}
        />
      </YStack>
      <YStack gap="$2" alignItems="center">
        {/* TODO: grey-700 vs secondary */}
        <Paragraph variant="sub" color="$grey-700" textAlign="center">
          You'll need your passport to setup the wallet
        </Paragraph>
        <Button.Solid alignSelf="stretch">Continue</Button.Solid>
      </YStack>
    </Page>
  )
}

const meta = {
  title: 'Funke/Onboarding Steps Screen',
  component: OnboardingStepsScreen,
  parameters: {
    deviceFrame: true,
  },
} satisfies Meta<typeof OnboardingStepsScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Screen: Story = {}
