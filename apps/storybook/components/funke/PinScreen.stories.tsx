import { Page, XStack, YStack } from '@package/ui'
import { OnboardingScreensHeader } from '@package/ui/src/components/OnboardingScreensHeader'
import type { Meta, StoryObj } from '@storybook/react'
import React, { useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import { Circle, Input } from 'tamagui'

interface PinScreenProps {
  pinLength: number
  onPinComplete: (pin: string) => void
  title: string
  subtitle?: string
}

const PinScreen = ({ title, subtitle, pinLength, onPinComplete }: PinScreenProps) => {
  const [pin, setPin] = useState('')
  const inputRef = useRef<TextInput>(null)

  const focusInput = () => {
    inputRef.current?.focus()
  }

  const onChangePin = (newPin: string) => {
    const sanitized = newPin.replace(/[^0-9]/g, '')
    setPin(sanitized)
    if (sanitized.length === 6) {
      onPinComplete(sanitized)
    }
  }

  return (
    <Page gap="$6">
      <OnboardingScreensHeader flex={1} progress={33} title={title} subtitle={subtitle} />
      <YStack flex={3} onPress={focusInput}>
        <XStack justifyContent="center" gap="$2">
          {new Array(pinLength).fill(0).map((_, i) => (
            <Circle
              // biome-ignore lint/suspicious/noArrayIndexKey: index is really what we want here
              key={i}
              size="$1.5"
              backgroundColor={pin[i] ? '$primary-500' : '$background'}
              borderColor="$primary-500"
              borderWidth="$1"
            />
          ))}
        </XStack>
        <Input
          ref={inputRef}
          value={pin}
          borderWidth={0}
          zIndex={-10000}
          position="absolute"
          maxLength={pinLength}
          onChangeText={onChangePin}
          flex={1}
          height={0}
          width={0}
          inputMode="numeric"
          secureTextEntry
        />
      </YStack>
    </Page>
  )
}

const meta = {
  title: 'Funke/Pin Screen',
  component: PinScreen,
  args: {
    pinLength: 6,
  },
  parameters: {
    deviceFrame: true,
  },
} satisfies Meta<typeof PinScreen>

export default meta

type Story = StoryObj<typeof meta>

export const PinEnter: Story = {
  args: {
    title: 'Pick a 6-digit app pin',
    subtitle: 'This will be used to unlock the Ausweis Wallet.',
  },
}
export const PinReEnter: Story = {
  args: {
    title: 'Re-enter your pin',
  },
}
