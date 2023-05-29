import {
  XStack,
  YStack,
  Image,
  borderRadiusSizes,
  Paragraph,
  Heading,
  Spacer,
  Icon,
} from '@internal/ui'

import { darken, getTextColorBasedOnBg } from 'app/utils/utilts'

type CredentialCardProps = {
  name?: string
  issuerName?: string
  subtitle?: string
  iconUrl?: string
  bgColor?: string
  shadow?: boolean
}

export default function CredentialCard({
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
    <XStack bg="$lightTranslucent" ai="center" br={borderRadiusSizes.rounded} pad="md">
      <Icon name="FileBadge" color="$grey-100" />
    </XStack>
  )

  return (
    <YStack
      pad="lg"
      g="xl"
      br={borderRadiusSizes.xl}
      bg={bgColor ?? '$grey-900'}
      shadow={shadow}
      width="100%"
      pressStyle={{
        backgroundColor: darken(bgColor ?? '#111111', 0.025),
      }}
    >
      <XStack jc="space-between">
        <XStack>{icon}</XStack>
        <YStack>
          <Heading variant="h3" textAlign="right" color={textColor}>
            {name}
          </Heading>
          <Paragraph textAlign="right" color={textColor}>
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
