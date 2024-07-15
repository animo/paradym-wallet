import { Button, Heading, HeroIcon, LucideIcon, Page, Separator, XStack, YStack } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LinearGradient } from 'tamagui/linear-gradient'
import { withDeviceFrameOnWeb } from '../../.storybook/withDeviceFrameOnWeb'

const FirstLaunchScreen = () => {
  return (
    <Page p="$0" flex-1>
      <LinearGradient
        position="absolute"
        flex={1}
        width="100%"
        height="100%"
        colors={['#EFF3F6', '#FFFFFF']}
        start={[0.5, 0]}
        end={[0.5, 1]}
      />
      <YStack p="$4" gap="$4" flex-1 justifyContent="space-between">
        {/* This stack keeps the  */}
        <YStack flex={3} />
        <YStack gap="$2">
          {/* todo: grey-5 */}
          <Heading variant="h1" color="#282C37">
            Ausweis Wallet
          </Heading>
          {/* todo: 1 is a bit too small, maybe just hardcode */}
          <Separator borderWidth="$1" borderRadius="$1" borderColor="$primary-500" width="$3" />
          {/* todo: grey-4 */}
          <Heading variant="h1" color="#656974">
            Your digital Identity
          </Heading>
        </YStack>
        <YStack flex-1 />
        {/* TODO: button height is higher in Funke app, need to set different default */}
        <XStack gap="$2" my="$2" height={55} display="flex" alignContent="stretch" alignItems="stretch">
          {/* todo: grey-1 */}
          <Button.Outline
            p="$0"
            width={55}
            height="100%"
            backgroundColor="#EFF3F6"
            borderWidth="$0.25"
            borderColor="#D7DCE080"
            borderRadius="$6"
          >
            <HeroIcon.GlobeAlt />
          </Button.Outline>
          {/* todo: grey-5 */}
          <Button.Solid height="100%" flexGrow={1} backgroundColor="#282C37" onPress={() => {}} borderRadius="$6">
            Get Started
          </Button.Solid>
        </XStack>
      </YStack>
    </Page>
  )
}

const meta = {
  title: 'Funke/First Launch Screen',
  decorators: [withDeviceFrameOnWeb],
  component: FirstLaunchScreen,
} satisfies Meta<typeof FirstLaunchScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Screen: Story = {}
