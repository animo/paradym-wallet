import { Stack } from '@package/ui'
import { Paragraph } from '@package/ui/src/base/Paragraph'
import { BlurView } from 'expo-blur'
import { StyleSheet } from 'react-native'

interface BlurBadgeProps {
  label: string
  color?: string
  tint?: 'light' | 'dark'
}

export function BlurBadge({ label, color, tint = 'light' }: BlurBadgeProps) {
  return (
    <Stack overflow="hidden" bg="#0000001A" br="$12" ai="center" gap="$2">
      <BlurView intensity={20} tint={tint} style={StyleSheet.absoluteFillObject} />
      <Paragraph variant="caption" opacity={0.8} px="$2.5" py="$0.5" color={color ? color : 'white'}>
        {label}
      </Paragraph>
    </Stack>
  )
}
