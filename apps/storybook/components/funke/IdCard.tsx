import { HeroIcons, Image, Paragraph, Stack, XStack, YStack } from '@package/ui'
import { StyleSheet } from 'react-native'
import { Circle } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'

export interface IdCardProps {
  icon: keyof typeof iconMapping
  issuerImage: string
  userName?: string
}

const iconMapping = {
  locked: <HeroIcons.LockClosed color="$white" />,
  loading: <HeroIcons.ArrowPath color="$white" />,
  complete: <HeroIcons.ShieldCheck color="$white" />,
} as const

export function IdCard({ icon, issuerImage, userName }: IdCardProps) {
  return (
    <YStack gap="$6" p="$5" borderRadius="$8" overflow="hidden" borderColor="rgba(216, 218, 200, 1)">
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
        <Circle size="$3" backgroundColor="$grey-700" opacity={0.4}>
          {iconMapping[icon]}
        </Circle>
      </XStack>
    </YStack>
  )
}
