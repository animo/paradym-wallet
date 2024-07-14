import { Heading, Page, Paragraph, Separator, YStack } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { View } from 'react-native'

const FirstLaunchScreen = () => {
  return (
    <Page height={4000}>
      <YStack>
        <YStack gap="$2">
          <Heading variant="title">Ausweis Wallet</Heading>
          <Separator borderWidth="$1" borderColor="$primary-500" width="20%" />
          <Paragraph variant="sub" size="$5">
            Your digital Identity
          </Paragraph>
        </YStack>
      </YStack>
    </Page>
  )
}

const meta = {
  title: 'FirstLaunchScreen',
  component: FirstLaunchScreen,
  args: {},
  decorators: [
    (Story) => (
      <View style={{ padding: 16, height: 500 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof FirstLaunchScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {}
