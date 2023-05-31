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

import { getTextColorBasedOnBg } from 'app/utils/utilts'

type CredentialCardProps = {
  name?: string
  issuerName?: string
  subtitle?: string
  iconUrl?: string
  bgColor?: string
}

export default function CredentialCard({
  iconUrl,
  name = 'Credential',
  subtitle,
  issuerName = 'Unknown',
  bgColor,
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
    <YStack pad="lg" g="xl" br={borderRadiusSizes.xl} bg={bgColor ?? '$grey-900'} shadow>
      <XStack jc="space-between">
        {icon}
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
          <Paragraph variant="sub" secondary color={textColor}>
            Issuer
          </Paragraph>
          <Paragraph color={textColor}>{issuerName}</Paragraph>
        </YStack>
      </XStack>
    </YStack>
  )
}
