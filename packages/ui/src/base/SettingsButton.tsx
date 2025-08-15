import { cloneElement } from 'react'
import Animated from 'react-native-reanimated'
import { Label } from 'tamagui'
import { BetaTag } from '../components/BetaTag'
import { HeroIcons } from '../content/Icon'
import type { IconContainerProps } from '../content/IconContainer'
import { useScaleAnimation } from '../hooks'
import { Paragraph } from './Paragraph'
import { XStack, YStack } from './Stacks'

type SettingsButtonProps = {
  label: string
  description?: string
  onPress: () => void
  icon?: IconContainerProps['icon']
  disabled?: boolean
  beta?: boolean
}

const AnimatedYStack = Animated.createAnimatedComponent(YStack)

export function SettingsButton({ label, disabled, icon, description, beta, onPress }: SettingsButtonProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: 0.95 })

  const onPressIn = disabled ? undefined : handlePressIn
  const onPressOut = disabled
    ? undefined
    : () => {
        handlePressOut()
        onPress()
      }

  return (
    <AnimatedYStack gap="$2" onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled} style={pressStyle}>
      <XStack jc="space-between" ai="center">
        <XStack gap="$3" ai="center">
          {icon && (
            <XStack bg="$primary-100" p="$1.5" br="$4">
              {cloneElement(icon, { size: 20, color: '$primary-500' })}
            </XStack>
          )}
          <XStack gap="$2">
            <Label
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={disabled}
              maxWidth={200}
              fontWeight="$semiBold"
              fontFamily="$default"
              fontSize={17}
              lineHeight="$5"
              letterSpacing="$8"
            >
              {label}
            </Label>
            {beta && (
              <YStack mt="$0.5" justifyContent="center">
                <BetaTag />
              </YStack>
            )}
          </XStack>
        </XStack>
        <HeroIcons.ChevronRight color="$primary-500" />
      </XStack>

      {description && <Paragraph variant="annotation">{description}</Paragraph>}
    </AnimatedYStack>
  )
}
