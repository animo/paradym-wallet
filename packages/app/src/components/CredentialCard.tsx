import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  Card,
  getTextColorBasedOnBg,
  HeroIcons,
  IconContainer,
  Image,
  Loader,
  LucideIcons,
  Paragraph,
  Spacer,
  Stack,
  useScaleAnimation,
  XStack,
  YStack,
} from '@package/ui'
import type { DisplayImage } from '@paradym/wallet-sdk'
import { BlurView } from 'expo-blur'
import { StyleSheet } from 'react-native'
import { BlurBadge } from './BlurBadge'
import { CredentialSvg, getSvgAspectRatio, useSvg } from './CredentialSvg'

type CredentialCardProps = {
  onPress?(): void
  name?: string
  bgColor?: string
  textColor?: string
  issuerImage?: DisplayImage
  backgroundImage?: DisplayImage
  /**
   * SVG that replaces the card design. Drawn with Skia, which runs no scripts and loads no external
   * resources, so an untrusted template can only draw.
   */
  svg?: string
  shadow?: boolean
  isLoading?: boolean
  isExpired?: boolean
  isRevoked?: boolean
}

export function CredentialCard({
  onPress,
  issuerImage,
  name,
  bgColor,
  textColor,
  backgroundImage,
  svg: svgSource,
  shadow = true,
  isLoading,
  isExpired,
  isRevoked,
}: CredentialCardProps) {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation({ scaleInValue: 0.99 })
  const svg = useSvg(svgSource)

  textColor = textColor ? textColor : bgColor ? getTextColorBasedOnBg(bgColor) : 'grey-100'

  const icon = issuerImage?.url ? (
    <Image src={issuerImage.url} width={36} height={36} />
  ) : (
    <XStack width={36} height={36} bg="lightTranslucent" ai="center" jc="center" br="12">
      <LucideIcons.FileBadge size={20} strokeWidth={2.5} color="grey-100" />
    </XStack>
  )

  const bgColorValue = bgColor ?? 'grey-900'
  const { t } = useLingui()
  return (
    <AnimatedStack
      shadow={shadow}
      br="8"
      bg={backgroundImage?.url && !svg ? 'transparent' : bgColorValue} // Only set bg color if no background image
      borderWidth="0-5"
      borderColor="borderTranslucent"
      position="relative"
      f={1}
      w="100%"
      maxWidth={360}
      als="center"
      style={pressStyle}
    >
      <Card
        f={1}
        br="8"
        p="5"
        backgroundColor="transparent"
        overflow="hidden"
        aspectRatio={svg ? getSvgAspectRatio(svg) : undefined}
        jc={svg ? 'flex-end' : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessible={true}
        accessibilityRole={onPress ? 'button' : undefined}
        aria-label="Credential"
      >
        {!svg && (
          <>
            <Card.Header p={0}>
              <XStack jc="space-between">
                <YStack f={1}>
                  <Paragraph fontSize={14} fontWeight="bold" color={textColor} numberOfLines={1}>
                    {(name ?? t(commonMessages.unknown)).toLocaleUpperCase()}
                  </Paragraph>
                </YStack>
                <XStack>{icon}</XStack>
              </XStack>
            </Card.Header>
            <Spacer size="11" />
          </>
        )}
        <Card.Footer h="3" jc="flex-end" ai="flex-end">
          {onPress && <IconContainer onPress={onPress} icon={<HeroIcons.ArrowRight color={textColor} />} />}
        </Card.Footer>
        {svg && (
          <Card.Background accessible={false}>
            <CredentialSvg svg={svg} />
          </Card.Background>
        )}
        {!svg && backgroundImage?.url && (
          <Card.Background accessible={false}>
            <Image
              backgroundColor={bgColor ?? 'grey-900'}
              src={backgroundImage.url}
              alt={backgroundImage.altText}
              width="100%"
              height="100%"
              contentFit="cover"
            />
          </Card.Background>
        )}
        {isLoading && (
          <XStack overflow="hidden" bg="#0000001A" br="12" ai="center" gap="2" bottom="5" left="5" pos="absolute">
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <Loader variant="dark" />
          </XStack>
        )}
        {(isExpired || isRevoked) && (
          <Stack pos="absolute" bottom="5" left="5">
            <BlurBadge color={textColor} label={isExpired ? t(commonMessages.expired) : t(commonMessages.revoked)} />
          </Stack>
        )}
      </Card>
    </AnimatedStack>
  )
}
