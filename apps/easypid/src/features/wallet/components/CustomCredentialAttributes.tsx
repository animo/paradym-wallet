import { pidSchemes } from '@easypid/constants'
import { type PidSdJwtVcAttributes, mapPidAttributeName, usePidCredential } from '@easypid/hooks/usePidCredential'
import { CredentialAttributes, type CredentialAttributesProps } from '@package/app/src'
import { Circle, Heading, Image, Paragraph, Stack, TableContainer, TableRow, YStack } from 'packages/ui/src'

type CustomCredentialAttributesProps = CredentialAttributesProps & {
  type: string
}

export function CustomCredentialAttributes({ type, ...props }: CustomCredentialAttributesProps) {
  if (pidSchemes.sdJwtVcVcts.includes(type)) {
    return <FunkePidCredentialAttributes />
  }
  return <CredentialAttributes {...props} />
}

// TODO: Add custom view for MDL
// TODO: Improve background/card design for MDL

export function FunkePidCredentialAttributes() {
  const { credential } = usePidCredential()

  const typedRawAttrs = credential?.rawAttributes as PidSdJwtVcAttributes

  const mainCardStrings = {
    name: `${typedRawAttrs.given_name} ${typedRawAttrs.family_name}`,
    born: `born ${typedRawAttrs.birthdate} (${typedRawAttrs.age_in_years})`,
    placeOfBirth: typedRawAttrs.place_of_birth?.locality ?? '',
    nationalities: typedRawAttrs.nationalities?.join(', ') ?? '',
  }

  const addressStrings = {
    street: typedRawAttrs.address?.street_address,
    locality: `${typedRawAttrs.address?.locality} (${typedRawAttrs.address?.country})`,
    postalCode: typedRawAttrs.address?.postal_code,
  }

  return (
    <Stack gap="$6">
      <YStack gap="$3" position="relative">
        <Stack h="$1" />
        <Stack pos="relative" ai="center">
          <Circle
            zi={5}
            borderWidth={2}
            borderColor="white"
            pos="absolute"
            top="$-5"
            bg="$idCardBackground"
            overflow="hidden"
            size="$8"
          >
            <Image width={56} height={56} src={credential?.display.issuer.logo?.url ?? ''} />
          </Circle>
          <TableContainer>
            <YStack
              bg="$tableBackgroundColor"
              ai="center"
              gap="$4"
              px="$2.5"
              py="$3"
              borderBottomWidth={2}
              borderBottomColor="$tableBorderColor"
            >
              <Stack h="$3" />
              <YStack gap="$2" ai="center">
                <Heading variant="h3">{mainCardStrings.name}</Heading>
                <Paragraph>{mainCardStrings.born}</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[mapPidAttributeName('place_of_birth'), mapPidAttributeName('nationalities')]}
              values={[mainCardStrings.placeOfBirth, mainCardStrings.nationalities]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      <YStack gap="$2">
        <Heading variant="sub2" secondary>
          Address
        </Heading>
        <TableContainer>
          <TableRow attributes={[mapPidAttributeName('street_address')]} values={[addressStrings.street]} />
          <TableRow
            attributes={[mapPidAttributeName('postal_code'), mapPidAttributeName('locality')]}
            values={[addressStrings.postalCode, addressStrings.locality]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}
