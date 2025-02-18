import type { DisplayImage } from '@package/agent'
import {
  AnimatedStack,
  Card,
  HeroIcons,
  IconContainer,
  Image,
  Loader,
  LucideIcons,
  Paragraph,
  Spacer,
  Stack,
  XStack,
  YStack,
  getTextColorBasedOnBg,
  useScaleAnimation,
} from '@package/ui'
import { BlurView } from 'expo-blur'
import { useState } from 'react'
import { StyleSheet } from 'react-native'

import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useHasInternetConnection } from '../hooks'
import { BlurBadge } from './BlurBadge'

type FunkeCredentialCardProps = {
  onPress?(): void
  name: string
  bgColor?: string
  textColor?: string
  issuerImage?: DisplayImage
  backgroundImage?: DisplayImage
  shadow?: boolean
  isLoading?: boolean
  isExpired?: boolean
  isRevoked?: boolean
}

export function FunkeCredentialCard({
  onPress,
  issuerImage,
  name,
  bgColor,
  textColor,
  backgroundImage,
  shadow = true,
  isLoading,
  isExpired,
  isRevoked,
}: FunkeCredentialCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation({ scaleInValue: 0.99 })
  const hasInternet = useHasInternetConnection()

  textColor = textColor ? textColor : getTextColorBasedOnBg(bgColor ?? '#000')

  const icon = issuerImage?.url ? (
    <Image src={issuerImage.url} width={36} height={36} />
  ) : (
    <XStack width={36} height={36} bg="$lightTranslucent" ai="center" jc="center" br="$12">
      <LucideIcons.FileBadge size={20} strokeWidth={2.5} color="$grey-100" />
    </XStack>
  )

  const bgColorValue = bgColor ?? '$grey-900'

  const fadeInStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLoaded ? 1 : 0, { duration: 200 }),
    }
  })

  return (
    <AnimatedStack
      shadow={shadow}
      br="$8"
      bg={bgColorValue}
      borderWidth="$0.5"
      borderColor="$borderTranslucent"
      position="relative"
      f={1}
      style={pressStyle}
    >
      <Card
        f={1}
        br="$8"
        p="$5"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        backgroundColor="transparent"
        onPress={onPress}
        overflow="hidden"
        accessible={true}
        accessibilityRole={onPress ? 'button' : undefined}
        aria-label="Credential"
      >
        <Card.Header p={0}>
          <XStack jc="space-between">
            <YStack f={1}>
              <Paragraph fontSize={14} fontWeight="$bold" color={textColor} numberOfLines={1}>
                {name.toLocaleUpperCase()}
              </Paragraph>
            </YStack>
            <XStack>{icon}</XStack>
          </XStack>
        </Card.Header>
        <Spacer size="$11" />
        <Card.Footer h="$3" jc="flex-end" ai="flex-end">
          {onPress && <IconContainer onPress={onPress} icon={<HeroIcons.ArrowRight color={textColor} />} />}
        </Card.Footer>
        {backgroundImage?.url && (
          <Card.Background accessible={false}>
            {hasInternet ? (
              <YStack width="100%" height="100%" bg={bgColor ?? '$grey-900'}>
                <AnimatedStack width="100%" height="100%" style={fadeInStyle}>
                  <Image
                    isImageLoaded={() => setIsLoaded(true)}
                    src={backgroundImage.url}
                    alt={backgroundImage.altText}
                    width="100%"
                    height="100%"
                    resizeMode="cover"
                  />
                </AnimatedStack>
              </YStack>
            ) : (
              <YStack width="100%" height="100%" bg={bgColor ?? '$grey-900'} />
            )}
          </Card.Background>
        )}
        {isLoading && (
          <XStack overflow="hidden" bg="#0000001A" br="$12" ai="center" gap="$2" bottom="$5" left="$5" pos="absolute">
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />
            <Loader variant="dark" />
          </XStack>
        )}
        {(isExpired || isRevoked) && (
          <Stack pos="absolute" bottom="$5" left="$5">
            <BlurBadge color={textColor} label={isExpired ? 'Expired' : 'Revoked'} />
          </Stack>
        )}
      </Card>
    </AnimatedStack>
  )
}
