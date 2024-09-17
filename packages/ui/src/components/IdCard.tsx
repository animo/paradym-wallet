import { BlurView } from 'expo-blur'
import { StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { Circle } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'
import { Button, Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons, Image, Spinner } from '../content'
import { useScaleAnimation } from '../hooks'

export interface IdCardProps {
  icon?: keyof typeof iconMapping
  issuerImage: number
  userName?: string
  hideUserName?: boolean
  onPress?: () => void
  small?: boolean
  isNotReceived?: boolean
}

const iconMapping = {
  locked: HeroIcons.LockClosed,
  loading: HeroIcons.ArrowPath,
  complete: HeroIcons.ShieldCheck,
  biometric: HeroIcons.FingerPrint,
} as const

export function IdCard({
  icon,
  issuerImage,
  userName,
  onPress,
  hideUserName,
  small,
  isNotReceived = false,
}: IdCardProps) {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <Animated.View style={pressStyle}>
      <YStack
        jc="space-between"
        height={small ? '$9' : '$15'}
        maxWidth={small ? '$14' : undefined}
        gap={small ? '$1' : '$6'}
        p={small ? '$3' : '$5'}
        borderRadius={small ? '$5' : '$8'}
        overflow="hidden"
        borderColor="#D8DAC8"
        bw={small ? '$0.25' : '$0.5'}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        position="relative"
      >
        {isNotReceived && (
          <Stack position="absolute" zIndex="$2" top={0} left={0} right={0} bottom={0}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />
            <YStack gap="$2" px="$4" flex-1 ai="center" jc="center">
              <Heading variant="sub1" fontWeight="$semiBold">
                No Digital ID
              </Heading>
              <Paragraph ta="center">Your Digital ID has not been activated yet.</Paragraph>
              <Stack py="$2">
                <Button.Solid h="$4" onPress={onPress}>
                  Set up digital ID
                </Button.Solid>
              </Stack>
            </YStack>
          </Stack>
        )}
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
          <YStack gap={small ? '$1' : '$3'}>
            <Paragraph size={small ? '$1' : '$2'} fontWeight="$bold" color="$grey-700">
              PERSONALAUSWEIS
            </Paragraph>
            <Paragraph size={small ? '$3' : '$6'} fontWeight="$semiBold">
              {hideUserName && !['locked', 'loading', undefined].includes(icon) ? '********' : userName ?? ''}
            </Paragraph>
          </YStack>
          <Stack>
            <Image src={issuerImage} width={small ? 12 : 24} height={small ? 24 : 48} resizeMode="contain" />
          </Stack>
        </XStack>
        <XStack justifyContent="space-between" flex-1>
          <XStack justifyContent="flex-start" alignItems="flex-end">
            {icon === 'loading' ? (
              <Circle size={small ? '$1' : '$3'} backgroundColor="#282C3740">
                <Spinner color="$white" />
              </Circle>
            ) : icon === 'biometric' ? (
              <Circle size={small ? '$1' : '$3'} backgroundColor="#282C3740">
                <HeroIcons.FingerPrint color="$white" size={small ? 12 : 24} />
              </Circle>
            ) : (
              <Stack width={small ? '$1' : '$3'} height={small ? '$1' : '$3'} />
            )}
          </XStack>
          <XStack justifyContent="flex-end" alignItems="flex-end">
            {onPress && <HeroIcons.ArrowRight color="$black" />}
          </XStack>
        </XStack>
      </YStack>
    </Animated.View>
  )
}
