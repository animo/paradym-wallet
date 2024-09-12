import type { DisplayImage } from '@package/agent'

import {
  Card,
  Heading,
  Image,
  LucideIcons,
  Paragraph,
  XStack,
  YStack,
  darken,
  getTextColorBasedOnBg,
} from '@package/ui'

import { useHasInternetConnection } from '../hooks'

type CredentialCardProps = {
  onPress?(): void
  name: string
  issuerName: string
  subtitle?: string
  bgColor?: string
  textColor?: string
  issuerImage?: DisplayImage
  backgroundImage?: DisplayImage
  shadow?: boolean
}

export function CredentialCard({
  onPress,
  issuerImage,
  name,
  subtitle,
  issuerName,
  bgColor,
  textColor,
  backgroundImage,
  shadow = true,
}: CredentialCardProps) {
  const hasInternet = useHasInternetConnection()

  textColor = textColor ? textColor : getTextColorBasedOnBg(bgColor ?? '#000')

  const icon = issuerImage?.url ? (
    <Image src={issuerImage.url} alt={issuerImage.altText} width={64} height={48} />
  ) : (
    <XStack width={48} height={48} bg="$lightTranslucent" ai="center" br="$12" pad="md">
      <LucideIcons.FileBadge color="$grey-100" />
    </XStack>
  )

  const getPressStyle = () => {
    if (!onPress) return {}
    if (backgroundImage?.url) return { opacity: 0.9 }
    return { backgroundColor: darken(bgColor ?? '$grey-900', 0.1) }
  }

  const bgColorValue = backgroundImage?.url ? '$transparent' : bgColor ?? '$grey-900'

  return (
    <XStack
      shadow={shadow}
      br="$8"
      bg={bgColorValue}
      borderWidth={0.5}
      borderColor="$borderTranslucent"
      position="relative"
    >
      <Card
        padded
        width="100%"
        br="$8"
        backgroundColor="transparent"
        pressStyle={getPressStyle()}
        h="$16"
        onPress={onPress}
        overflow="hidden"
      >
        <Card.Header padding={0}>
          <XStack jc="space-between">
            <XStack pr="$4">{icon}</XStack>
            <YStack f={1}>
              <Heading variant="h3" size="$4" textAlign="right" color={textColor} numberOfLines={2}>
                {name}
              </Heading>
              <Paragraph variant="annotation" textAlign="right" color={textColor} numberOfLines={1} opacity={0.8}>
                {subtitle}
              </Paragraph>
            </YStack>
          </XStack>
        </Card.Header>
        <Card.Footer>
          <XStack>
            <YStack>
              <Paragraph variant="annotation" opacity={0.8} color={textColor}>
                Issuer
              </Paragraph>
              <Paragraph variant="sub" color={textColor} numberOfLines={2}>
                {issuerName}
              </Paragraph>
            </YStack>
          </XStack>
        </Card.Footer>
        {backgroundImage?.url && (
          <Card.Background>
            {hasInternet ? (
              <YStack width="100%" height="100%" bg={bgColor ?? '$grey-900'}>
                <Image
                  src={backgroundImage.url}
                  alt={backgroundImage.altText}
                  width="100%"
                  height="100%"
                  resizeMode="cover"
                />
              </YStack>
            ) : (
              <YStack width="100%" height="100%" bg={bgColor ?? '$grey-900'} />
            )}
          </Card.Background>
        )}
      </Card>
    </XStack>
  )
}
