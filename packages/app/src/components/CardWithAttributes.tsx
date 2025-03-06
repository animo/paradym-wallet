import type { DisplayImage } from '@package/agent/src'
import {
  AnimatedStack,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  Paragraph,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui/src'
import { sanitizeString } from '@package/utils/src'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useHasInternetConnection } from '../hooks'
import { BlurBadge } from './BlurBadge'

interface CardWithAttributesProps {
  id?: string
  name: string
  backgroundColor?: string
  textColor?: string
  issuerImage?: DisplayImage
  backgroundImage?: DisplayImage
  formattedDisclosedAttributes: string[]
  disclosedPayload?: Record<string, unknown>
  isExpired?: boolean
  isRevoked?: boolean
  isNotYetActive?: boolean
}

export function CardWithAttributes({
  id,
  name,
  backgroundColor,
  issuerImage,
  textColor,
  backgroundImage,
  formattedDisclosedAttributes,
  disclosedPayload,
  isNotYetActive = false,
  isExpired = false,
  isRevoked = false,
}: CardWithAttributesProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation()
  const router = useRouter()
  const hasInternet = useHasInternetConnection()

  const groupedAttributes = useMemo(() => {
    const result: Array<[string, string | undefined]> = []
    for (let i = 0; i < formattedDisclosedAttributes.length; i += 2) {
      result.push([formattedDisclosedAttributes[i], formattedDisclosedAttributes[i + 1]])
    }
    return result
  }, [formattedDisclosedAttributes])

  const onPress = () => {
    router.push(
      `/credentials/requestedAttributes?id=${id}&disclosedPayload=${encodeURIComponent(
        JSON.stringify(disclosedPayload ?? {})
      )}&disclosedAttributeLength=${formattedDisclosedAttributes?.length}`
    )
  }

  const isRevokedOrExpired = isRevoked || isExpired
  const disabledNav = !id || !disclosedPayload || isRevokedOrExpired

  return (
    <AnimatedStack
      br="$6"
      borderWidth="$0.5"
      borderColor="$borderTranslucent"
      overflow="hidden"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={disabledNav ? undefined : pressStyle}
      onPress={disabledNav ? undefined : onPress}
      accessible={true}
      role={disabledNav ? undefined : 'button'}
      aria-label={`Shared attributes from ${name.toLocaleUpperCase()}`}
    >
      <Stack px="$4" py="$3" pos="relative" bg={backgroundColor ?? '$grey-100'}>
        {hasInternet && backgroundImage?.url && (
          <Stack pos="absolute" top={0} left={0} right={0} bottom={0}>
            <Image
              src={backgroundImage?.url ?? ''}
              alt={backgroundImage?.altText ?? ''}
              resizeMode="cover"
              height="100%"
              width="100%"
            />
          </Stack>
        )}
        <XStack ai="center" jc="space-between">
          <YStack f={1}>
            <Heading variant="sub2" fontSize={14} fontWeight="$bold" numberOfLines={1} color={textColor ?? '$grey-700'}>
              {name.toLocaleUpperCase()}
            </Heading>
          </YStack>
          <XStack h="$3">
            {issuerImage?.url && !isRevokedOrExpired && (
              <Image src={issuerImage.url} alt={issuerImage.altText} width={36} height={36} />
            )}
          </XStack>
        </XStack>
      </Stack>
      <YStack px="$4" pt="$3" pb="$4" gap="$4" bg="$white">
        <YStack gap="$2" fg={1} pr="$4">
          {groupedAttributes.map(([first, second], index) => (
            <XStack key={first + second} gap="$4" minHeight="$3.5">
              <Stack flexGrow={1} flexBasis={0}>
                <Paragraph fontSize={15}>{sanitizeString(first)}</Paragraph>
              </Stack>
              <Stack flexGrow={1} flexBasis={0}>
                <Paragraph
                  fontSize={15}
                  numberOfLines={index === groupedAttributes.length - 1 ? 1 : undefined}
                  ellipsizeMode={index === groupedAttributes.length - 1 ? 'tail' : undefined}
                  pr={index === groupedAttributes.length - 1 ? '$5' : undefined}
                >
                  {second ? sanitizeString(second) : ''}
                </Paragraph>
              </Stack>
            </XStack>
          ))}
          {!disabledNav && (
            <Stack pos="absolute" bottom="$0" right="$0">
              <IconContainer onPress={onPress} icon={<HeroIcons.ArrowRight />} />
            </Stack>
          )}
        </YStack>
      </YStack>
      {(isRevoked || isExpired || isNotYetActive) && (
        <>
          <Stack bg="$grey-900" pos="absolute" top="$0" left="$0" right="$0" bottom="$0" opacity={0.2} zIndex={0} />
          <Stack pos="absolute" top="$3.5" right="$2.5">
            <BlurBadge
              tint="dark"
              color={textColor}
              label={isExpired ? 'Card expired' : isRevoked ? 'Card revoked' : 'Card inactive'}
            />
          </Stack>
        </>
      )}
    </AnimatedStack>
  )
}
