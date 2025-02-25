import { ClaimFormat } from '@credo-ts/core'
import { mdlSchemes, pidSchemes } from '@easypid/constants'
import { type MdlAttributes, getImageForMdlCode, mapMdlAttributeName } from '@easypid/utils/mdlCustomMetadata'
import {
  type Arf15PidSdJwtVcAttributes,
  type PidMdocAttributes,
  type PidSdJwtVcAttributes,
  mapPidAttributeName,
} from '@easypid/utils/pidCustomMetadata'
import type { CredentialForDisplay } from '@package/agent'
import { CredentialAttributes } from '@package/app/src'
import { Circle, Heading, Image, Paragraph, Stack, TableContainer, TableRow, XStack, YStack } from 'packages/ui/src'

type CustomCredentialAttributesProps = {
  credential: CredentialForDisplay
}

export function CustomCredentialAttributes({ credential }: CustomCredentialAttributesProps) {
  if ([...pidSchemes.arfSdJwtVcVcts, ...pidSchemes.msoMdocDoctypes].includes(credential.metadata.type)) {
    return <FunkeArfPidCredentialAttributes credential={credential} />
  }
  if (pidSchemes.sdJwtVcVcts.includes(credential.metadata.type)) {
    return <FunkeBdrPidCredentialAttributes credential={credential} />
  }
  if ([...mdlSchemes.mdlSdJwtVcVcts, ...mdlSchemes.mdlMdocDoctypes].includes(credential.metadata.type)) {
    return <FunkeMdlCredentialAttributes credential={credential} />
  }

  return <CredentialAttributes subject={credential.attributes} />
}

export function FunkeArfPidCredentialAttributes({ credential }: CustomCredentialAttributesProps) {
  // We don't pass attributes here as props because we need to use the specified displayPriority
  // const { credential } = useCredentialByCategory('DE-PID')

  const isPidSdJwtVc = credential?.claimFormat === ClaimFormat.SdJwtVc
  const isPidMdoc = credential?.claimFormat === ClaimFormat.MsoMdoc

  const personalInfoCard = {
    name: '',
    born: '',
    placeOfBirth: '',
    nationalities: '',
  }

  const addressTable = {
    street: '',
    locality: '',
    postalCode: '',
  }

  let headerImage = credential?.display.issuer.logo?.url ?? ''

  if (isPidSdJwtVc) {
    const raw = credential?.rawAttributes as Arf15PidSdJwtVcAttributes
    personalInfoCard.name = `${raw.given_name} ${raw.family_name}`
    personalInfoCard.born = `born ${raw.birth_date} (${raw.age_in_years})`
    personalInfoCard.placeOfBirth = raw.birth_place ?? ''
    personalInfoCard.nationalities = Array.isArray(raw.nationality)
      ? raw.nationality?.join(', ')
      : raw.nationality ?? ''

    addressTable.street = raw.resident_street ?? ''
    addressTable.locality = `${raw.resident_city} (${raw.resident_country})`
    addressTable.postalCode = raw.resident_postal_code ?? ''
    headerImage = raw.portrait ?? headerImage
  }

  if (isPidMdoc) {
    const raw = credential?.rawAttributes as PidMdocAttributes
    personalInfoCard.name = `${raw.given_name} ${raw.family_name}`
    personalInfoCard.born = `born ${raw.birth_date}`
    personalInfoCard.placeOfBirth = raw.birth_place ?? ''
    personalInfoCard.nationalities = Array.isArray(raw.nationality) ? raw.nationality.join(',') : raw.nationality ?? ''

    addressTable.street = raw.resident_street ?? ''
    addressTable.locality = `${raw.resident_city} (${raw.resident_country})`
    addressTable.postalCode = raw.resident_postal_code ?? ''
    headerImage = raw.portrait ?? headerImage
  }
  return (
    <Stack gap="$4">
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
            <Image width={80} height={80} src={headerImage} />
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
                <Heading variant="h3">{personalInfoCard.name}</Heading>
                <Paragraph>{personalInfoCard.born}</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[mapPidAttributeName('place_of_birth'), mapPidAttributeName('nationalities')]}
              values={[personalInfoCard.placeOfBirth, personalInfoCard.nationalities]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      <YStack gap="$2">
        <Heading variant="sub2" secondary>
          Address
        </Heading>
        <TableContainer>
          <TableRow attributes={[mapPidAttributeName('street_address')]} values={[addressTable.street]} />
          <TableRow
            attributes={[mapPidAttributeName('postal_code'), mapPidAttributeName('locality')]}
            values={[addressTable.postalCode, addressTable.locality]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}

/**
 * Bdr
 */
export function FunkeBdrPidCredentialAttributes({ credential }: CustomCredentialAttributesProps) {
  const personalInfoCard = {
    name: '',
    born: '',
    placeOfBirth: '',
    nationalities: '',
  }

  const addressTable = {
    street: '',
    locality: '',
    postalCode: '',
  }

  const raw = credential?.rawAttributes as PidSdJwtVcAttributes
  personalInfoCard.name = `${raw.given_name} ${raw.family_name}`
  personalInfoCard.born = `born ${raw.birthdate} (${raw.age_in_years})`
  personalInfoCard.placeOfBirth = raw.place_of_birth?.locality ?? ''
  personalInfoCard.nationalities = raw.nationalities?.join(', ') ?? ''

  addressTable.street = raw.address?.street_address ?? ''
  addressTable.locality = `${raw.address?.locality} (${raw.address?.country})`
  addressTable.postalCode = raw.address?.postal_code ?? ''

  return (
    <Stack gap="$4">
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
                <Heading variant="h3">{personalInfoCard.name}</Heading>
                <Paragraph>{personalInfoCard.born}</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[mapPidAttributeName('place_of_birth'), mapPidAttributeName('nationalities')]}
              values={[personalInfoCard.placeOfBirth, personalInfoCard.nationalities]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      <YStack gap="$2">
        <Heading variant="sub2" secondary>
          Address
        </Heading>
        <TableContainer>
          <TableRow attributes={[mapPidAttributeName('street_address')]} values={[addressTable.street]} />
          <TableRow
            attributes={[mapPidAttributeName('postal_code'), mapPidAttributeName('locality')]}
            values={[addressTable.postalCode, addressTable.locality]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}

export function FunkeMdlCredentialAttributes({ credential }: CustomCredentialAttributesProps) {
  const raw = credential.rawAttributes as MdlAttributes

  const mainCard = {
    name: `${raw.given_name} ${raw.family_name}`,
    privileges: raw.driving_privileges.map((privilege) => privilege.vehicle_category_code).join(', '),
    documentNumber: raw.document_number,
  }

  const issuanceInfo = {
    issuingAuthority: raw.issuing_authority,
    issuingCountry: raw.issuing_country,
    expiryDate: raw.expiry_date,
    unDistinguishingSign: raw.un_distinguishing_sign,
  }
  console.log(credential.record.encoded)
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
            <Image width={80} height={80} src={raw.portrait} />
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
                <Heading variant="h3">{mainCard.name}</Heading>
                <Paragraph>Führerschein</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[mapMdlAttributeName('privileges'), mapMdlAttributeName('document_number')]}
              values={[
                <XStack key="driving-privileges-icons" gap="$3">
                  {raw.driving_privileges.map((privilege) => (
                    <Image
                      key={privilege.vehicle_category_code}
                      src={getImageForMdlCode(privilege.vehicle_category_code)}
                      width={36}
                      height={28}
                    />
                  ))}
                </XStack>,
                mainCard.documentNumber,
              ]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      <YStack gap="$2">
        <Heading variant="sub2" secondary>
          Driving privileges
        </Heading>
        <TableContainer>
          {raw.driving_privileges.map((privilege) => (
            <TableRow
              key={`${privilege.vehicle_category_code}-${privilege.expiry_date}`}
              attributes={[mapMdlAttributeName('code'), mapMdlAttributeName('expiry_date')]}
              values={[
                <XStack key={privilege.vehicle_category_code} ai="center" gap="$3">
                  <Paragraph color="$grey-900" fontWeight="$semiBold" fontSize={18}>
                    {privilege.vehicle_category_code}
                  </Paragraph>
                  <Image
                    key={privilege.vehicle_category_code}
                    src={getImageForMdlCode(privilege.vehicle_category_code)}
                    width={32}
                    height={16}
                  />
                </XStack>,
                privilege.expiry_date ?? 'No expiry date',
              ]}
            />
          ))}
        </TableContainer>
      </YStack>
      <YStack gap="$2">
        <Heading variant="sub2" secondary>
          About the card
        </Heading>
        <TableContainer>
          <TableRow attributes={[mapMdlAttributeName('issuing_authority')]} values={[issuanceInfo.issuingAuthority]} />
          <TableRow attributes={[mapMdlAttributeName('expiry_date')]} values={[issuanceInfo.expiryDate]} />
          <TableRow
            attributes={[mapMdlAttributeName('issuing_country'), mapMdlAttributeName('un_distinguishing_sign')]}
            values={[issuanceInfo.issuingCountry, issuanceInfo.unDistinguishingSign]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}
