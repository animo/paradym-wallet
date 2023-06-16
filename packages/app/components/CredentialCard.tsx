import type { DisplayImage } from '@internal/agent'

import {
  XStack,
  YStack,
  Image,
  Paragraph,
  Heading,
  Spacer,
  FileBadge,
  darken,
  getTextColorBasedOnBg,
} from '@internal/ui'

type CredentialCardProps = {
  onPress?(): void
  name: string
  issuerName: string
  subtitle?: string
  bgColor?: string
  issuerImage?: DisplayImage
  shadow?: boolean
}

export default function CredentialCard({
  onPress,
  issuerImage,
  name,
  subtitle,
  issuerName,
  bgColor,
  shadow = true,
}: CredentialCardProps) {
  const textColor = getTextColorBasedOnBg(bgColor ?? '#000')

  const icon =
    issuerImage && issuerImage.url && issuerImage.altText ? (
      <Image src={issuerImage.url} alt={issuerImage.altText} width={64} height={48} />
    ) : (
      <XStack width={48} height={48} bg="$lightTranslucent" ai="center" br="$12" pad="md">
        <FileBadge color="$grey-100" />
      </XStack>
    )

  return (
    <YStack
      pad="lg"
      g="xl"
      br="$8"
      bg={bgColor ?? '$grey-900'}
      shadow={shadow}
      width="100%"
      borderWidth={0.5}
      borderColor="$borderTranslucent"
      pressStyle={{
        backgroundColor: onPress && darken(bgColor ?? '$grey-900', 0.05),
      }}
      onPress={onPress}
    >
      <XStack jc="space-between">
        <XStack pr="$4">{icon}</XStack>
        <YStack f={1}>
          <Heading variant="h3" size="$4" textAlign="right" color={textColor} numberOfLines={1}>
            {name}
          </Heading>
          <Paragraph textAlign="right" color={textColor} numberOfLines={1}>
            {subtitle}
          </Paragraph>
        </YStack>
      </XStack>
      <Spacer />
      <XStack>
        <YStack>
          <Paragraph variant="annotation" opacity={0.8} color={textColor}>
            Issuer
          </Paragraph>
          <Paragraph variant="sub" color={textColor}>
            {issuerName}
          </Paragraph>
        </YStack>
      </XStack>
    </YStack>
  )
}
