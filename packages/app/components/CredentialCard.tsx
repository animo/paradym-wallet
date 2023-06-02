import {
  XStack,
  YStack,
  Image,
  Paragraph,
  Heading,
  Spacer,
  Icon,
  darken,
  getTextColorBasedOnBg,
} from '@internal/ui'

type CredentialCardProps = {
  onPress?(): void
  name?: string
  issuerName?: string
  subtitle?: string
  iconUrl?: string
  bgColor?: string
  shadow?: boolean
}

export default function CredentialCard({
  onPress,
  iconUrl,
  name = 'Credential',
  subtitle,
  issuerName = 'Unknown',
  bgColor,
  shadow = true,
}: CredentialCardProps) {
  const textColor = getTextColorBasedOnBg(bgColor ?? '#000')

  const icon = iconUrl ? (
    <Image src={iconUrl} width={48} height={48} />
  ) : (
    <XStack bg="$lightTranslucent" ai="center" br="$2" pad="md">
      <Icon name="FileBadge" color="$grey-100" />
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
        backgroundColor: darken(bgColor ?? '$grey-900', 0.025),
      }}
      onPress={onPress}
    >
      <XStack jc="space-between">
        <XStack pr="$4">{icon}</XStack>
        <YStack f={1}>
          <Heading variant="h3" textAlign="right" color={textColor} numberOfLines={1}>
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
          <Paragraph variant="annotation" secondary color={textColor}>
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
