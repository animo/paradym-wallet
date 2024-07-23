import {
  Button,
  Heading,
  type HeroIcon,
  HeroIcons,
  Image,
  Page,
  Paragraph,
  ProgressBar,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import React, { useRef, useState } from 'react'
import { StyleSheet, type TextInput } from 'react-native'
import { Circle, Input } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'

import { useArgs } from '@storybook/addons'

const germanIssuerImage = require('../../../funke/assets/german-issuer-image.png')

interface IdCardPinScreenProps {
  pinLength: number
  onPinComplete: (pin: string) => void
  state: 'enterPin' | 'loading' | 'complete'
  onGoToWallet: () => void
  userName?: string
}

const stateMapping = {
  enterPin: { title: 'Enter passport pin', icon: 'locked' },
  loading: { title: 'Setting up identity', icon: 'loading' },
  complete: { title: 'You wallet is ready', icon: 'complete' },
} as const

const iconMapping = {
  locked: <HeroIcons.LockClosed color="$white" />,
  loading: <HeroIcons.ArrowPath color="$white" />,
  complete: <HeroIcons.ShieldCheck color="$white" />,
} as const

interface IdCardProps {
  icon: keyof typeof iconMapping
  issuerImage: string
  userName?: string
}

function IdCard({ icon, issuerImage, userName }: IdCardProps) {
  return (
    <YStack gap="$6" p="$5" borderRadius="$8" overflow="hidden" borderWidth={1} borderColor="rgba(216, 218, 200, 1)">
      <LinearGradient
        colors={['#EFE7DA', '#EDEEE6', '#E9EDEE', '#D4D6C0']}
        start={[0.98, 0.02]}
        end={[0.28, 1.0]}
        locations={[0.0207, 0.3341, 0.5887, 1.0]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.2)']}
        start={[0, 0]}
        end={[1, 0]}
        style={StyleSheet.absoluteFillObject}
      />
      <XStack justifyContent="space-between">
        <YStack gap="$1">
          <Paragraph secondary>Personalausweis</Paragraph>
          <Paragraph size="$6" fontWeight="$regular">
            {userName ?? '********'}
          </Paragraph>
        </YStack>
        <Stack>
          <Image src={issuerImage} width={75} height={75} resizeMode="contain" />
        </Stack>
      </XStack>
      <XStack justifyContent="flex-end">
        {/* TODO: background color variables */}
        <Circle size="$3" backgroundColor={icon === 'complete' ? '#C9D6BD' : '#02010033'}>
          {iconMapping[icon]}
        </Circle>
      </XStack>
    </YStack>
  )
}

const IdCardPinScreen = ({ pinLength, onPinComplete, state, onGoToWallet, userName }: IdCardPinScreenProps) => {
  const { title, icon } = stateMapping[state]
  const [pin, setPin] = useState<string[]>(new Array(pinLength).fill(''))
  const inputRefs = useRef<Array<TextInput | null>>([])
  const programmaticFocus = useRef(false)

  const isIndexFocusable = (index: number) => {
    const firstFocusableIndex = pin.findIndex((digit) => digit === '')
    return firstFocusableIndex === -1 || index <= firstFocusableIndex
  }

  const setPinValue = (digit: string, index: number) => {
    const sanitized = digit.replace(/[^0-9]/g, '')
    if (sanitized === '') return

    setPin((pin) => {
      const newPin = [...pin]
      newPin[index] = sanitized
      return newPin
    })

    // Focus next input
    if (index < pin.length - 1) {
      programmaticFocus.current = true
      inputRefs.current[index + 1]?.focus()
    } else if (index === pin.length - 1) {
      inputRefs.current[index]?.blur()
      onPinComplete(pin.join(''))
    }
  }

  const focusInput = (index: number) => {
    // We programmatically focus, but the user can also focus. This is a hack to
    // know when we are in programmatic mode
    if (programmaticFocus.current) {
      programmaticFocus.current = false
      return
    }

    // If e.g. the user presses the 3rd pin, but 2nd pin is still
    // empty it will focus the 2nd pin
    const firstEmptyIndex = pin.findIndex((digit) => digit === '')
    if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
      inputRefs.current[firstEmptyIndex]?.focus()
    } else {
      inputRefs.current[index]?.focus()
    }
  }

  return (
    <Page gap="$6" justifyContent="space-between">
      <ProgressBar value={25} />
      <YStack flexBasis={0} flexGrow={2} flexShrink={1} justifyContent="space-between">
        <Heading variant="title">{title}</Heading>
        <XStack display={state === 'enterPin' ? 'flex' : 'none'} gap="$3" justifyContent="center">
          {pin.map((digit, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the correct key here
            <YStack key={index} maxWidth={35} flex-1 justifyContent="center">
              <Input
                p="$0"
                textAlign="center"
                borderWidth={0}
                fontSize="$6"
                ref={(ref) => {
                  inputRefs.current[index] = ref
                }}
                value={digit}
                focusable={isIndexFocusable(index)}
                onFocus={() => focusInput(index)}
                onKeyPress={(text) => setPinValue(text.nativeEvent.key, index)}
                focusVisibleStyle={{
                  outlineStyle: 'none',
                }}
                outlineStyle="none"
                autoFocus={index === 0}
                maxLength={1}
                inputMode="numeric"
                accessible={true}
                aria-label={`Pin digit ${index + 1}`}
                accessibilityHint="Enter the digit of the pin"
              />
              <Stack borderBottomWidth={1} borderBottomColor="$grey-900" width="100%" />
            </YStack>
          ))}
        </XStack>
      </YStack>
      <Stack gap="$4" flexBasis={0} flexGrow={4} flexShrink={1}>
        <IdCard icon={icon} issuerImage={germanIssuerImage} userName={userName} />
        {/* TODO: grey-500 vs secondary */}
        {state === 'loading' && (
          <Paragraph variant="sub" color="$grey-500" textAlign="center">
            This can take a minute.
          </Paragraph>
        )}
      </Stack>
      <Stack flexBasis={0} flexGrow={2} flexShrink={1} justifyContent="flex-end">
        {state === 'complete' && (
          <Button.Solid onPress={onGoToWallet}>
            Go to wallet <HeroIcons.ArrowRight size={20} />
          </Button.Solid>
        )}
      </Stack>
    </Page>
  )
}

const meta = {
  title: 'Funke/ID Card Pin Screen',
  component: IdCardPinScreen,
  args: {
    pinLength: 6,
  },
  parameters: {
    deviceFrame: true,
  },
} satisfies Meta<typeof IdCardPinScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Flow: Story = {
  args: {
    state: 'enterPin',
  },
  render: (args) => {
    const [_, updateArgs] = useArgs<IdCardPinScreenProps>()
    return (
      <IdCardPinScreen
        {...args}
        onPinComplete={() => {
          updateArgs({ state: 'loading' })
          setTimeout(() => updateArgs({ state: 'complete', userName: 'Jan Ritfeld' }), 3000)
        }}
      />
    )
  },
}

export const PinEnter: Story = {
  args: {
    state: 'enterPin',
  },
}

export const Loading: Story = {
  args: {
    state: 'loading',
  },
}

export const Complete: Story = {
  args: {
    state: 'complete',
    userName: 'Jan Ritfeld',
  },
}
