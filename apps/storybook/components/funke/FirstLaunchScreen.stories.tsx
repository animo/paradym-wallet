import { Button, Heading, HeroIcons, Page, Separator, XStack, YStack } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LinearGradient } from 'tamagui/linear-gradient'

const FirstLaunchScreen = () => {
  return (
    <Page p="$0" flex-1>
      <LinearGradient
        position="absolute"
        flex={1}
        width="100%"
        height="100%"
        colors={['$grey-100', '$white']}
        start={[0.5, 0]}
        end={[0.5, 1]}
      />
      <YStack p="$4" gap="$4" flex-1 justifyContent="space-between">
        {/* This stack ensures the right spacing  */}
        <YStack flex={3} />
        <YStack gap="$2">
          <Heading variant="title">Ausweis Wallet</Heading>
          <Separator borderWidth={3} borderRadius={3} borderColor="$primary-500" width="$4" />
          <Heading variant="title" secondary>
            Your digital Identity
          </Heading>
        </YStack>
        <YStack flex-1 />
        <XStack gap="$2" my="$2">
          <Button.Outline p="$0" width="$buttonHeight">
            <HeroIcons.GlobeAlt />
          </Button.Outline>
          <Button.Solid flexGrow={1} onPress={() => {}}>
            Get Started
          </Button.Solid>
        </XStack>
      </YStack>
    </Page>
  )
}

const meta = {
  title: 'Funke/First Launch Screen',
  component: FirstLaunchScreen,
  parameters: {
    deviceFrame: true,
  },
} satisfies Meta<typeof FirstLaunchScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Screen: Story = {}
