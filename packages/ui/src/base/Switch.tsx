import { cloneElement } from 'react'
import Animated from 'react-native-reanimated'
import { Label, Switch as TamaguiSwitch } from 'tamagui'
import { useScaleAnimation } from '../hooks'
import { Paragraph } from './Paragraph'
import { XStack, YStack } from './Stacks'

type SettingsSwitchProps = {
  id: string
  label: string
  description?: string
  value: boolean
  icon?: React.ReactElement
  disabled?: boolean
  onChange: (value: boolean) => void
  beta?: boolean
}

const AnimatedSwitch = Animated.createAnimatedComponent(TamaguiSwitch)

export function Switch({ id, label, value, disabled, onChange, icon, description, beta }: SettingsSwitchProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: 0.95 })

  return (
    <YStack gap="$2">
      <XStack jc="space-between" ai="center">
        <XStack gap="$3" ai="center">
          {icon && (
            <XStack bg={value ? '$primary-100' : '$grey-200'} p="$1.5" br="$4">
              {cloneElement(icon, { size: 20, color: value ? '$primary-500' : '$grey-500' })}
            </XStack>
          )}
          <XStack gap="$2">
            <Label
              maxWidth={200}
              numberOfLines={1}
              fontWeight="$semiBold"
              fontFamily="$default"
              fontSize={17}
              lineHeight="$5"
              letterSpacing="$8"
            >
              {label}
            </Label>
            {beta && (
              <YStack bg="$primary-100" h="$1.5" br="$12" mt="$0.5" px="$2">
                <Paragraph h="$2" fontSize="$1" mt="$-1" fontWeight="$semiBold" color="$primary-500">
                  BETA
                </Paragraph>
              </YStack>
            )}
          </XStack>
        </XStack>
        <AnimatedSwitch
          bw="$1"
          onCheckedChange={onChange}
          bg={value ? '$primary-500' : '$grey-300'}
          bc={value ? '$primary-500' : '$grey-300'}
          id={id}
          w={56}
          checked={value}
          disabled={disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={pressStyle}
        >
          <TamaguiSwitch.Thumb bw={1} scale={0.9} borderColor="$grey-200" bg="white" animation="quick" />
        </AnimatedSwitch>
      </XStack>
      {description && <Paragraph variant="annotation">{description}</Paragraph>}
    </YStack>
  )
}
