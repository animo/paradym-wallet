import { Button, Page, Stack } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'

import { ProgressHeader } from '@package/ui/src/components/ProgressHeader'
import { YStack } from 'tamagui'

const IdCardScanningScreen = ({ isScanning }: { isScanning: boolean }) => {
  const title = isScanning ? 'Keep your card still' : 'Place your card on top of your phone'

  return (
    <Page flex-1 gap="$6">
      <ProgressHeader flex={1} progress={66} />
      <Stack flex={2} />
      <YStack flex={1} justifyContent="flex-end">
        {/* TODO: grey-700 vs secondary */}
        {!isScanning && <Button.Solid>Start scanning</Button.Solid>}
      </YStack>
    </Page>
  )
}

const meta = {
  title: 'Funke/ID Card Scanning Screen',
  component: IdCardScanningScreen,
  parameters: {
    deviceFrame: true,
  },
} satisfies Meta<typeof IdCardScanningScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Intro: Story = {
  args: {
    isScanning: false,
  },
}
export const Scanning: Story = {
  args: {
    isScanning: true,
  },
}
