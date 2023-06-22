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
  Card,
} from '@internal/ui'
import { useState } from 'react'

import { useHasInternetConnection } from 'app/hooks/useHasInternetConnection'

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

export default function CredentialCard({
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

  const icon =
    issuerImage && issuerImage.url ? (
      <Image src={issuerImage.url} alt={issuerImage.altText} width={64} height={48} />
    ) : (
      <XStack width={48} height={48} bg="$lightTranslucent" ai="center" br="$12" pad="md">
        <FileBadge color="$grey-100" />
      </XStack>
    )

  return (
    <XStack shadow={shadow} position="relative">
      <Card
        padded
        width="100%"
        br="$8"
        bg={!backgroundImage ? bgColor ?? '$grey-900' : '$transparent'}
        pressStyle={{
          backgroundColor: onPress && darken(bgColor ?? '$grey-900', 0.05),
        }}
        borderWidth={0.5}
        borderColor="$borderTranslucent"
        onPress={onPress}
      >
        <Card.Header>
          <XStack jc="space-between">
            <XStack pr="$4">{icon}</XStack>
            <YStack f={1}>
              <Heading variant="h3" size="$4" textAlign="right" color={textColor} numberOfLines={1}>
                {name}
              </Heading>
              <Paragraph
                variant="sub"
                textAlign="right"
                color={textColor}
                numberOfLines={1}
                opacity={0.8}
              >
                {subtitle}
              </Paragraph>
            </YStack>
          </XStack>
        </Card.Header>
        <Spacer size="$11" />
        <Card.Footer>
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
        </Card.Footer>
        {backgroundImage && backgroundImage.url && (
          <Card.Background>
            {hasInternet ? (
              <YStack width="100%" height="100%" bg={bgColor ?? '$grey-900'}>
                <Image
                  src={backgroundImage.url}
                  alt={backgroundImage.altText}
                  resizeMode="cover"
                  width="100%"
                  height="100%"
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
