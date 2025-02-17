import { Button, HeroIcons, Page, Paragraph, Stack, XStack, YStack } from '@package/ui'
import type { Meta, StoryObj } from '@storybook/react'
import { useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { Input } from 'tamagui'

import { ProgressHeader } from '@package/ui/src/components/ProgressHeader'
import { useArgs } from '@storybook/addons'
import { IdCard } from './IdCard'

const germanIssuerImage = require('../../../easypid/assets/german-issuer-image.png')

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

const IdCardPinScreen = ({ pinLength, onPinComplete, state, onGoToWallet, userName }: IdCardPinScreenProps) => {
  const { title, icon } = stateMapping[state]
  const [pin, setPin] = useState<string[]>(new Array(pinLength).fill(''))
  const inputRefs = useRef<Array<TextInput | null>>([])
  const programmaticFocus = useRef(false)

  const isIndexFocusable = (index: number) => {
    const firstFocusableIndex = pin.findIndex((digit) => digit === '')
    return firstFocusableIndex === -1 || index <= firstFocusableIndex
  }

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to go the previous input field
    if (key === 'Backspace') {
      setPin((pin) => {
        const newPin = [...pin]
        if (pin[index] !== '') {
          newPin[index] = ''
        } else if (index >= 1) {
          // Need to focus on previous input entry as well
          newPin[index - 1] = ''
          programmaticFocus.current = true
          inputRefs.current[index - 1]?.focus()
        }

        return newPin
      })

      return
    }

    const sanitized = key.replace(/[^0-9]/g, '')
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
      <ProgressHeader progress={state === 'complete' ? 100 : 66} />
      <YStack gap="$4" flex={1}>
        {state === 'enterPin' && (
          <Animated.View exiting={FadeOut} entering={FadeIn} layout={LinearTransition.springify()}>
            <XStack gap="$3" justifyContent="center">
              {pin.map((digit, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: index is the correct key here
                <YStack key={index} maxWidth={35} flex-1 justifyContent="center">
                  <Input
                    p="$0"
                    backgroundColor="transparent"
                    textAlign="center"
                    borderWidth={0}
                    fontSize="$6"
                    ref={(ref) => {
                      inputRefs.current[index] = ref
                    }}
                    value={digit}
                    focusable={isIndexFocusable(index)}
                    onFocus={() => focusInput(index)}
                    onKeyPress={(text) => handleKeyPress(text.nativeEvent.key, index)}
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
          </Animated.View>
        )}
        <Animated.View exiting={FadeOut} entering={FadeIn} layout={LinearTransition.springify()}>
          <IdCard icon={icon} issuerImage={germanIssuerImage} userName={userName} />
        </Animated.View>
        {/* TODO: grey-500 vs secondary */}
        {state === 'loading' && (
          <Paragraph variant="sub" color="$grey-500" textAlign="center">
            This can take a minute.
          </Paragraph>
        )}
      </YStack>
      <Stack>
        {state === 'complete' && (
          <Animated.View entering={FadeIn} layout={LinearTransition}>
            <Button.Solid onPress={onGoToWallet}>
              Go to wallet <HeroIcons.ArrowRight size={20} />
            </Button.Solid>
          </Animated.View>
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
