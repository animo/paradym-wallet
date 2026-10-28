import { createSwitch, SwitchFrame, SwitchThumbFrame } from '@tamagui/switch'
import { cloneElement } from 'react'
import Animated from 'react-native-reanimated'
import { Label, styled } from 'tamagui'
import { BetaTag } from '../components/BetaTag'
import type { IconContainerProps } from '../content'
import { useScaleAnimation } from '../hooks'
import { Paragraph } from './Paragraph'
import { XStack, YStack } from './Stacks'

type SettingsSwitchProps = {
  id: string
  label: string
  description?: string
  value: boolean
  icon?: IconContainerProps['icon']
  disabled?: boolean
  onChange: (value: boolean) => void
  beta?: boolean
}

// v3's `tamagui` Switch sizes itself from Config v6's sizing ladder, which our tokens don't have. These are the sizes
// the v2 Switch had at its default size.
const TamaguiSwitch = createSwitch({
  Frame: styled(SwitchFrame, { borderRadius: 1000, width: 58, height: 29, minHeight: 29 }),
  Thumb: styled(SwitchThumbFrame, { borderRadius: 1000, width: 29, height: 29 }),
})

const AnimatedSwitch = Animated.createAnimatedComponent(TamaguiSwitch)

export function Switch({ id, label, value, disabled, onChange, icon, description, beta }: SettingsSwitchProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: 0.95 })

  return (
    <YStack gap="2">
      <XStack jc="space-between" ai="center">
        <XStack gap="3" ai="center">
          {icon && (
            <XStack bg={value ? 'primary-100' : 'grey-200'} p="1-5" br="4">
              {cloneElement(icon, { size: 20, color: value ? 'primary-500' : 'grey-500' })}
            </XStack>
          )}
          <XStack gap="2">
            <Label
              maxWidth={200}
              fontWeight="medium"
              fontFamily="default"
              fontSize={17}
              lineHeight="5"
              letterSpacing="8"
            >
              {label}
            </Label>
            {beta && (
              <YStack mt="0-5" justifyContent="center">
                <BetaTag />
              </YStack>
            )}
          </XStack>
        </XStack>
        <AnimatedSwitch
          onCheckedChange={onChange}
          bg={value ? 'primary-500' : 'grey-300'}
          id={id}
          w={56}
          checked={value}
          disabled={disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={pressStyle}
        >
          <TamaguiSwitch.Thumb bw={1} scale={0.9} borderColor="grey-200" bg="white" transition="quick" />
        </AnimatedSwitch>
      </XStack>
      {description && <Paragraph variant="annotation">{description}</Paragraph>}
    </YStack>
  )
}
