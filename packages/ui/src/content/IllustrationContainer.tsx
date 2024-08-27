import { LinearGradient } from 'tamagui/linear-gradient'
import { Stack, YStack } from '../base'
import { RippleCircle } from './AnimatedFingerPrintCircle'

type IllustrationContainerVariant = 'feature' | 'danger'

export function IllustrationContainerBackground() {
  return (
    <LinearGradient
      colors={['#FFFFFF00', '#00000033', '#FFFFFF00', '#00000033', '#FFFFFF00', '#00000033', '#FFFFFF00']}
      locations={[0, 0.2, 0.46, 0.67, 0.79, 0.92, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        opacity: 0.25,
        height: '100%',
        width: '100%',
        position: 'absolute',
      }}
    />
  )
}

export function IllustrationContainer({
  children,
  pulse,
  variant = 'feature',
}: { children: React.ReactNode; pulse?: boolean; variant?: IllustrationContainerVariant }) {
  const bgColor = variant === 'feature' ? '#D5DDF0CC' : '#F8E5ECCC'

  return (
    <Stack bg={bgColor} br="$4" overflow="hidden">
      <IllustrationContainerBackground />
      <YStack h="$15" jc="center" ai="center">
        {pulse && <RippleCircle />}
        <CircleContainer variant={variant}>{children}</CircleContainer>
      </YStack>
    </Stack>
  )
}

export const CircleContainer = ({
  children,
  variant = 'feature',
}: { children: React.ReactNode; variant?: IllustrationContainerVariant }) => {
  const bgColor = variant === 'feature' ? '#4365DE33' : '#E5598633'
  const innerBgColor = variant === 'feature' ? '#4365DE99' : '#E5598699'

  return (
    <Stack h={156} w={156} bg={bgColor} br={999} jc="center" ai="center">
      <Stack h={124} w={124} bg={innerBgColor} br={999} jc="center" ai="center">
        <LinearGradient
          colors={['#ffffff0D', '#FFFFFFCC', '#ffffff0D']}
          style={{
            position: 'absolute',
            width: 124,
            height: 124,
            borderRadius: 999,
            opacity: 0.2,
          }}
        />
        {children}
      </Stack>
    </Stack>
  )
}
