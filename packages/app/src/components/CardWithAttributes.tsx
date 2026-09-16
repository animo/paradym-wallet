import {
  AnimatedStack,
  AttributeListItem,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  Stack,
  useScaleAnimation,
  XStack,
  YStack,
} from '@package/ui'
import type { CredentialMetadata, DisplayImage, FormattedAttribute, FormattedAttributeArray } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { BlurBadge } from './BlurBadge'

interface CardWithAttributesProps {
  id?: string
  name: string
  backgroundColor?: string
  textColor?: string
  issuerImage?: DisplayImage
  backgroundImage?: DisplayImage
  /** Rendered as given: pass labels ready for display, they are not formatted again. */
  formattedDisclosedAttributes: string[]
  /** Entries of `formattedDisclosedAttributes` the card lacks, shown in red. */
  missingAttributes?: string[]
  disclosedPayload?: FormattedAttribute[]
  disclosedMetadata?: CredentialMetadata
  isExpired?: boolean
  isRevoked?: boolean
  isNotYetActive?: boolean
}

/** Two attributes to a row. */
function toRows(attributes: string[]) {
  const rows: Array<[string, string | undefined]> = []
  for (let i = 0; i < attributes.length; i += 2) {
    rows.push([attributes[i], attributes[i + 1]])
  }
  return rows
}

export function CardWithAttributes({
  id,
  name,
  backgroundColor,
  issuerImage,
  textColor,
  backgroundImage,
  formattedDisclosedAttributes,
  missingAttributes,
  disclosedPayload,
  disclosedMetadata,
  isNotYetActive = false,
  isExpired = false,
  isRevoked = false,
}: CardWithAttributesProps) {
  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation()
  const router = useRouter()

  // What the card holds first, then what it lacks, each group starting on a row of its own.
  const groupedAttributes = useMemo(() => {
    const isMissing = (attribute: string) => missingAttributes?.includes(attribute) ?? false

    return [
      ...toRows(formattedDisclosedAttributes.filter((attribute) => !isMissing(attribute))),
      ...toRows(formattedDisclosedAttributes.filter(isMissing)),
    ]
  }, [formattedDisclosedAttributes, missingAttributes])

  const onPress = () => {
    if (id) {
      router.push(
        `/credentials/requestedAttributes?id=${id}&disclosedPayload=${encodeURIComponent(
          JSON.stringify(disclosedPayload ?? [])
        )}&disclosedMetadata=${encodeURIComponent(
          JSON.stringify(disclosedMetadata ?? {})
        )}&disclosedAttributeLength=${formattedDisclosedAttributes?.length}`
      )
    } else {
      const params = new URLSearchParams({
        item: JSON.stringify({
          path: [],
          type: 'array',
          rawValue: [],
          value: disclosedPayload ?? [],
        } satisfies FormattedAttributeArray),
      })

      if (name) params.set('parentName', name)

      router.push(`/credentials/id/nested?${params.toString()}`)
    }
  }

  const isRevokedOrExpired = isRevoked || isExpired
  const disabledNav = !disclosedPayload
  const isMissing = (attribute: string) => missingAttributes?.includes(attribute) ?? false

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
      tabIndex={0}
      role={disabledNav ? undefined : 'button'}
      aria-label={`Shared attributes from ${name.toLocaleUpperCase()}`}
    >
      <Stack px="$4" py="$3" pos="relative" bg={backgroundColor ?? '$grey-900'}>
        {backgroundImage?.url && (
          <Stack pos="absolute" top={0} left={0} right={0} bottom={0}>
            <Image
              src={backgroundImage.url}
              alt={backgroundImage.altText}
              contentFit="cover"
              height="100%"
              width="100%"
            />
          </Stack>
        )}
        <XStack ai="center" jc="space-between">
          <YStack f={1}>
            <Heading heading="sub2" fontSize={14} fontWeight="$bold" numberOfLines={1} color={textColor ?? '$grey-200'}>
              {name.toLocaleUpperCase()}
            </Heading>
          </YStack>
          <XStack h="$3">
            {issuerImage?.url && !isRevokedOrExpired && (
              <Image circle src={issuerImage.url} alt={issuerImage.altText} width={36} height={36} />
            )}
          </XStack>
        </XStack>
      </Stack>
      <YStack px="$4" pt="$3" pb="$4" gap="$4" bg="$white">
        <YStack gap="$2" fg={1} pr="$4">
          {groupedAttributes.map(([first, second], index) => {
            const isLast = index === groupedAttributes.length - 1

            return (
              // Keeps the last row level with the arrow in the corner.
              <XStack key={`${first}-${second}`} gap="$3" minHeight={isLast ? '$3.5' : undefined}>
                <Stack flexGrow={1} flexBasis={0}>
                  <AttributeListItem name={first} isMissing={isMissing(first)} />
                </Stack>
                <Stack flexGrow={1} flexBasis={0}>
                  {/* Padded inside the column rather than on it: padding on the column itself
                      would widen it, and shift this row's second column out of line. */}
                  <Stack pr={isLast && !disabledNav ? '$5' : undefined}>
                    {second && <AttributeListItem name={second} isMissing={isMissing(second)} />}
                  </Stack>
                </Stack>
              </XStack>
            )
          })}
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
