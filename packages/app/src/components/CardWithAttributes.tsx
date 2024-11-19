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
import { OMITTED_CREDENTIAL_ATTRIBUTES } from '../utils'
import { BlurBadge } from './BlurBadge'

interface CardWithAttributesProps {
  id: string
  name: string
  backgroundColor?: string
  textColor?: string
  issuerImage?: DisplayImage
  backgroundImage?: DisplayImage
  disclosedAttributes: string[]
  disclosedPayload?: Record<string, unknown>
  disableNavigation?: boolean
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
  disclosedAttributes,
  disclosedPayload,
  disableNavigation = false,
  isNotYetActive = false,
  isExpired = false,
  isRevoked = false,
}: CardWithAttributesProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation()
  const router = useRouter()
  const hasInternet = useHasInternetConnection()

  const filteredDisclosedAttributes = disclosedAttributes.filter(
    (attribute) => !OMITTED_CREDENTIAL_ATTRIBUTES.includes(attribute)
  )

  const groupedAttributes = useMemo(() => {
    const result: Array<[string, string | undefined]> = []
    for (let i = 0; i < filteredDisclosedAttributes.length; i += 2) {
      result.push([filteredDisclosedAttributes[i], filteredDisclosedAttributes[i + 1]])
    }
    return result
  }, [filteredDisclosedAttributes])

  const onPress = () => {
    router.push(
      `/credentials/requestedAttributes?id=${id}&disclosedPayload=${encodeURIComponent(
        JSON.stringify(disclosedPayload ?? {})
      )}&disclosedAttributeLength=${filteredDisclosedAttributes?.length}`
    )
  }

  const isRevokedOrExpired = isRevoked || isExpired
  const disabledNav = disableNavigation || !disclosedPayload || isRevokedOrExpired

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
      accessibilityRole={disabledNav ? undefined : 'button'}
      aria-label={`Shared attributes from ${name.toLocaleUpperCase()}`}
    >
      <Stack px="$4" py="$3" pos="relative" backgroundColor={'green'} bg={backgroundColor ?? '$grey-900'}>
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
            <Heading variant="sub2" fontSize={14} fontWeight="$bold" numberOfLines={1} color={textColor}>
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
          {groupedAttributes.map(([first, second]) => (
            <XStack key={first + second} gap="$4">
              <Stack flexGrow={1} flexBasis={0}>
                <Paragraph fontSize={15}>{sanitizeString(first)}</Paragraph>
              </Stack>
              <Stack flexGrow={1} flexBasis={0}>
                <Paragraph fontSize={15}>{second ? sanitizeString(second) : ''}</Paragraph>
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
      {/* FIXME: should this only be shown if expired? */}
      {/* <Stack bg="$grey-900" pos="absolute" top="$0" left="$0" right="$0" bottom="$0" opacity={0.2} zIndex={0} /> */}
      {(isRevoked || isExpired || isNotYetActive) && (
        <Stack pos="absolute" top="$3.5" right="$2.5">
          <BlurBadge
            tint="dark"
            color={textColor}
            label={isExpired ? 'Card expired' : isRevoked ? 'Card revoked' : 'Card inactive'}
          />
        </Stack>
      )}
    </AnimatedStack>
  )
}
