import type { ClaimFormat } from '@credo-ts/core'
import { getPidAttributesForDisplay, getPidDisclosedAttributeNames, usePidCredential } from '@easypid/hooks'
import type { CredentialMetadata, DisplayImage, FormattedSubmission } from '@package/agent/src'
import { useHasInternetConnection } from '@package/app/src/hooks'
import { OMITTED_CREDENTIAL_ATTRIBUTES } from '@package/app/src/utils'
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
} from '@package/ui'
import { sanitizeString } from '@package/utils/src'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const { credential: pidCredential } = usePidCredential()

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading variant="sub1" fontWeight="$semiBold">
          Requested information
        </Heading>
        <YStack gap="$4">
          <Paragraph>
            {submission.areAllSatisfied
              ? 'The following will be shared.'
              : `You don't have the requested credential(s).`}
          </Paragraph>
          {submission.entries.map((entry) => (
            <YStack gap="$4" key={entry.inputDescriptorId}>
              {entry.credentials.map((credential) => {
                if (credential.metadata?.type === pidCredential?.type) {
                  const disclosedAttributes = getPidDisclosedAttributeNames(
                    credential?.disclosedPayload ?? {},
                    credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                  )

                  const disclosedPayload = getPidAttributesForDisplay(
                    credential?.disclosedPayload ?? {},
                    credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                  )

                  return (
                    <CardWithAttributes
                      key={credential.id as string}
                      id={credential.id as string}
                      name={pidCredential?.display.name as string}
                      backgroundImage={pidCredential?.display.backgroundImage}
                      backgroundColor={pidCredential?.display.backgroundColor}
                      disclosedAttributes={disclosedAttributes}
                      disclosedPayload={disclosedPayload}
                    />
                  )
                }
                return (
                  <CardWithAttributes
                    key={credential.id}
                    id={credential.id}
                    name={credential.credentialName}
                    backgroundImage={credential.backgroundImage}
                    backgroundColor={credential.backgroundColor}
                    disclosedAttributes={credential.requestedAttributes ?? []}
                    disclosedPayload={credential?.disclosedPayload ?? {}}
                  />
                )
              })}
            </YStack>
          ))}
        </YStack>
      </YStack>
    </YStack>
  )
}

export function CardWithAttributes({
  id,
  name,
  backgroundColor,
  backgroundImage,
  disclosedAttributes,
  disclosedPayload,
  disableNavigation = false,
}: {
  id: string
  name: string
  backgroundColor?: string
  backgroundImage?: DisplayImage
  disclosedAttributes: string[]
  disclosedPayload?: Record<string, unknown>
  disableNavigation?: boolean
}) {
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

  return (
    <AnimatedStack
      br="$6"
      borderWidth="$0.5"
      borderColor="$borderTranslucent"
      overflow="hidden"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={disableNavigation ? undefined : pressStyle}
      onPress={disableNavigation ? undefined : onPress}
    >
      <Stack p="$5" pos="relative" bg={backgroundColor ?? '$grey-900'}>
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
      </Stack>
      <YStack px="$4" pt="$3" pb="$4" gap="$4" bg="$white">
        <Heading variant="h2">
          {filteredDisclosedAttributes.length} from {name}
        </Heading>
        <YStack gap="$2" fg={1} pr="$4">
          {groupedAttributes.map(([first, second]) => (
            <XStack key={first + second} gap="$4">
              <Stack flexGrow={1} flexBasis={0}>
                <Paragraph variant="sub" color="#415963">
                  {sanitizeString(first)}
                </Paragraph>
              </Stack>
              <Stack flexGrow={1} flexBasis={0}>
                <Paragraph variant="sub" color="#415963">
                  {second ? sanitizeString(second) : ''}
                </Paragraph>
              </Stack>
            </XStack>
          ))}
          {!disableNavigation && disclosedPayload && (
            <Stack pos="absolute" bottom="$0" right="$0">
              <IconContainer onPress={onPress} icon={<HeroIcons.ArrowRight />} />
            </Stack>
          )}
        </YStack>
      </YStack>
    </AnimatedStack>
  )
}
