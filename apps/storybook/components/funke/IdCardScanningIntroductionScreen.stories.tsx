import { Button, Heading, Page, ProgressBar, Stack } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

// TODO: src import?
import { NfcCardScanningPlacementImage } from '@package/ui/src/images/NfcScanningCardPlacementImage'

import { YStack } from 'tamagui'

const IdCardScanningScreen = ({ isScanning }: { isScanning: boolean }) => {
  const title = isScanning ? 'Keep your card still' : 'Place your card on top of your phone'

  return (
    <Page flex-1>
      {/* FIXME */}
      {/* flex not working as expected https://github.com/tamagui/tamagui/issues/2806 */}
      <YStack gap="$6" flexBasis={0} flexGrow={1} flexShrink={1}>
        <ProgressBar value={25} />
        <Heading variant="title">{title}</Heading>
      </YStack>
      <Stack flexBasis={0} flexGrow={2} flexShrink={1}>
        <NfcCardScanningPlacementImage height="100%" />
      </Stack>
      <YStack flexBasis={0} flexGrow={1} flexShrink={1} justifyContent="flex-end">
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
