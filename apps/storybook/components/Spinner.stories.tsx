import { Spinner } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'

const meta = {
  title: 'Spinner',
  component: Spinner,
  args: {
    variant: 'light',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

export const Dark: Story = {
  args: {
    variant: 'light',
  },
}
export const Light: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },

  args: {
    variant: 'dark',
  },
}
