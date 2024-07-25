import { Button, Page, Stack } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

// TODO: src import?
import { NfcCardScanningPlacementImage } from '@package/ui/src/images/NfcScanningCardPlacementImage'

import { YStack } from 'tamagui'
import { OnboardingScreensHeader } from './OnboardingScreensHeader'

const IdCardScanningScreen = ({ isScanning }: { isScanning: boolean }) => {
  const title = isScanning ? 'Keep your card still' : 'Place your card on top of your phone'

  return (
    <Page flex-1 gap="$6">
      <OnboardingScreensHeader flex={1} title={title} progress={66} />
      <Stack flex={2}>
        <NfcCardScanningPlacementImage height="100%" />
      </Stack>
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
