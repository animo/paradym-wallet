import { ClaimFormat } from '@credo-ts/core'
import { mdlSchemes, pidSchemes } from '@easypid/constants'
import { getMdlCode, type MdlAttributes } from '@easypid/utils/mdlCustomMetadata'
import {
  type Arf15PidSdJwtVcAttributes,
  type Arf18PidSdJwtVcAttributes,
  formatArfPid18PlaceOfBirth,
  type PidMdocAttributes,
  type PidSdJwtVcAttributes,
} from '@easypid/utils/pidCustomMetadata'
import { Trans, useLingui } from '@lingui/react/macro'
import type { CredentialForDisplay } from '@package/agent'
import { CredentialAttributes } from '@package/app'
import { commonMessages } from '@package/translations'
import { Circle, Heading, Image, Paragraph, Stack, TableContainer, TableRow, XStack, YStack } from '@package/ui'

type CustomCredentialAttributesProps = {
  credential: CredentialForDisplay
}

export const hasCustomCredentialDisplay = (credentialType: string) => {
  return (
    [...pidSchemes.arfSdJwtVcVcts, ...pidSchemes.msoMdocDoctypes].includes(credentialType) ||
    [...pidSchemes.sdJwtVcVcts].includes(credentialType) ||
    [...mdlSchemes.mdlSdJwtVcVcts, ...mdlSchemes.mdlMdocDoctypes].includes(credentialType)
  )
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

  return <CredentialAttributes attributes={credential.attributes} />
}

export function FunkeArfPidCredentialAttributes({ credential }: CustomCredentialAttributesProps) {
  const { t } = useLingui()
  // We don't pass attributes here as props because we need to use the specified displayPriority
  // const { credential } = useCredentialByCategory('DE-PID')

  const isPidSdJwtVc = credential?.claimFormat === ClaimFormat.SdJwtDc
  const isPidMdoc = credential?.claimFormat === ClaimFormat.MsoMdoc
  const isLegacySdJwtPid = isPidSdJwtVc && credential.metadata.type !== 'urn:eudi:pid:1'

  const personalInfoCard: {
    name: string | null
    born: string | null
    placeOfBirth: string | null
    nationalities: string | null
  } = {
    name: null,
    born: null,
    placeOfBirth: null,
    nationalities: null,
  }

  let addressTable:
    | string
    | {
        street: string | null
        locality: string | null
        postalCode: string | null
        country: string | null
      }
    | null = null

  let headerImage = credential?.display.issuer.logo?.url ?? ''

  if (isLegacySdJwtPid) {
    const raw = credential?.rawAttributes as Arf15PidSdJwtVcAttributes
    personalInfoCard.name = `${raw.given_name} ${raw.family_name}`
    personalInfoCard.born = `${t(commonMessages.fields.born)} ${raw.birth_date} (${raw.age_in_years})`
    personalInfoCard.placeOfBirth = raw.birth_place ?? ''
    personalInfoCard.nationalities = Array.isArray(raw.nationality)
      ? raw.nationality?.join(', ')
      : (raw.nationality ?? '')

    addressTable = {
      street: raw.resident_street ?? '',
      locality: `${raw.resident_city} (${raw.resident_country})`,
      postalCode: raw.resident_postal_code ?? '',
      country: null,
    }
    headerImage = raw.portrait ?? headerImage
  } else if (isPidSdJwtVc) {
    const raw = credential?.rawAttributes as unknown as Arf18PidSdJwtVcAttributes
    personalInfoCard.name = `${raw.given_name} ${raw.family_name}`
    personalInfoCard.born = `${t(commonMessages.fields.born)} ${raw.birthdate}`
    personalInfoCard.placeOfBirth = formatArfPid18PlaceOfBirth(raw.place_of_birth)
    personalInfoCard.nationalities = raw.nationalities?.join(', ')

    if (raw.address?.formatted) {
      addressTable = raw.address.formatted
    } else if (raw.address) {
      const locality =
        raw.address.locality || raw.address.region
          ? `${raw.address.locality || raw.address.region}${raw.address.country ? ` (${raw.address.country})` : ''}`
          : null

      const country = raw.address.country && !locality ? raw.address.country : null
      const postalCode = raw.address.postal_code || null
      const street = raw.address.street_address
        ? `${raw.address.street_address}${raw.address.house_number !== undefined ? ` ${raw.address.house_number}` : ''}`
        : null

      if (locality || country || postalCode || street) {
        addressTable = {
          postalCode,
          locality,
          country,
          street,
        }
      }
    }

    headerImage = raw.picture ?? headerImage
  } else if (isPidMdoc) {
    const raw = credential?.rawAttributes as PidMdocAttributes
    personalInfoCard.name = `${raw.given_name} ${raw.family_name}`
    personalInfoCard.born = `${t(commonMessages.fields.born)} ${raw.birth_date}`
    personalInfoCard.placeOfBirth = raw.birth_place ?? ''
    personalInfoCard.nationalities = Array.isArray(raw.nationality)
      ? raw.nationality.join(',')
      : (raw.nationality ?? '')

    addressTable = {
      street: raw.resident_street ?? '',
      locality: `${raw.resident_city} (${raw.resident_country})`,
      postalCode: raw.resident_postal_code ?? '',
      country: null,
    }
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
                <Heading ta="center" heading="h3">
                  {personalInfoCard.name}
                </Heading>
                <Paragraph>{personalInfoCard.born}</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[t(commonMessages.fields.place_of_birth), t(commonMessages.fields.nationalities)]}
              values={[personalInfoCard.placeOfBirth, personalInfoCard.nationalities]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      {addressTable && (
        <YStack gap="$2">
          <Heading heading="sub2" secondary>
            {t(commonMessages.fields.address)}
          </Heading>

          <TableContainer>
            {typeof addressTable === 'string' && <TableRow values={[addressTable]} />}
            {typeof addressTable !== 'string' && (
              <>
                {addressTable.street && (
                  <TableRow attributes={t(commonMessages.fields.street)} values={[addressTable.street]} />
                )}
                {(addressTable.postalCode || addressTable.locality || addressTable.country) && (
                  <TableRow
                    attributes={[
                      addressTable.postalCode ? t(commonMessages.fields.postal_code) : undefined,
                      addressTable.locality
                        ? t(commonMessages.fields.locality)
                        : addressTable.country
                          ? t(commonMessages.fields.country)
                          : undefined,
                    ].filter((a) => a !== undefined)}
                    values={[addressTable.postalCode, addressTable.locality ?? addressTable.country].filter(
                      (a) => a !== null
                    )}
                  />
                )}
              </>
            )}
          </TableContainer>
        </YStack>
      )}
    </Stack>
  )
}

/**
 * Bdr
 */
export function FunkeBdrPidCredentialAttributes({ credential }: CustomCredentialAttributesProps) {
  const { t } = useLingui()

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
  personalInfoCard.born = `${t(commonMessages.fields.born)} ${raw.birthdate} (${raw.age_in_years})`
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
            {credential?.display.issuer.logo?.url && (
              <Image width={56} height={56} src={credential.display.issuer.logo.url} />
            )}
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
                <Heading ta="center" heading="h3">
                  {personalInfoCard.name}
                </Heading>
                <Paragraph>{personalInfoCard.born}</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[t(commonMessages.fields.place_of_birth), t(commonMessages.fields.nationalities)]}
              values={[personalInfoCard.placeOfBirth, personalInfoCard.nationalities]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      <YStack gap="$2">
        <Heading heading="sub2" secondary>
          Address
        </Heading>
        <TableContainer>
          <TableRow attributes={[t(commonMessages.fields.street)]} values={[addressTable.street]} />
          <TableRow
            attributes={[t(commonMessages.fields.postal_code), t(commonMessages.fields.locality)]}
            values={[addressTable.postalCode, addressTable.locality]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}

export function FunkeMdlCredentialAttributes({ credential }: CustomCredentialAttributesProps) {
  const { t } = useLingui()
  const raw = credential.rawAttributes as MdlAttributes

  const sortedPrivileges = raw.driving_privileges
    .map((privilege) => ({
      privilege,
      code: getMdlCode(privilege.vehicle_category_code),
    }))
    .sort((a, b) => (a.code.index === undefined ? 1 : b.code.index === undefined ? -1 : a.code.index - b.code.index))

  const mainCard = {
    name: `${raw.given_name} ${raw.family_name}`,
    // Only show first three
    privileges: sortedPrivileges
      .slice(0, 3)
      .filter((e): e is typeof e & { code: { icon: string } } => e.code.icon !== undefined),
    documentNumber: raw.document_number,
  }

  const privilegesCountString = sortedPrivileges.length > 3 ? `(+${sortedPrivileges.length - 3})` : ''

  const issuanceInfo = {
    issuingAuthority: raw.issuing_authority,
    issuingCountry: raw.issuing_country,
    expiryDate: raw.expiry_date,
    unDistinguishingSign: raw.un_distinguishing_sign,
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
                <Heading heading="h3">{mainCard.name}</Heading>
                <Paragraph>
                  {/* Führerschein in german */}
                  {t(commonMessages.credentials.mdl.driving_license)}
                </Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[
                `${t(commonMessages.credentials.mdl.driving_privileges)} ${privilegesCountString}`,
                t(commonMessages.credentials.mdl.document_number),
              ]}
              values={[
                <XStack key="driving-privileges-icons" gap="$3">
                  {mainCard.privileges.map((privilege) => (
                    <Image key={privilege.code.code} src={privilege.code.icon} width={36} height={28} />
                  ))}
                </XStack>,
                mainCard.documentNumber,
              ]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      <YStack gap="$2">
        <Heading heading="sub2" secondary>
          {t(commonMessages.credentials.mdl.driving_privileges)}
        </Heading>
        <TableContainer>
          {sortedPrivileges.map(({ privilege, code }) => {
            return (
              <TableRow
                key={`${privilege.vehicle_category_code}-${privilege.expiry_date}`}
                attributes={[
                  t(commonMessages.credentials.mdl.code),
                  ...(privilege.expiry_date ? [t(commonMessages.fields.expires_at)] : []),
                ]}
                values={[
                  <XStack key={privilege.vehicle_category_code} ai="center" gap="$3">
                    <Paragraph color="$grey-900" fontWeight="$semiBold" fontSize={18}>
                      {privilege.vehicle_category_code}
                    </Paragraph>
                    {code.icon && (
                      <Image key={privilege.vehicle_category_code} src={code.icon} width={36} height={28} />
                    )}
                  </XStack>,
                  ...(privilege.expiry_date ? [privilege.expiry_date] : []),
                ]}
              />
            )
          })}
        </TableContainer>
      </YStack>
      <YStack gap="$2">
        <Heading heading="sub2" secondary>
          <Trans id="cardAttributes.aboutTheCard">About the card</Trans>
        </Heading>
        <TableContainer>
          <TableRow
            attributes={[t(commonMessages.fields.issuing_authority)]}
            values={[issuanceInfo.issuingAuthority]}
          />
          <TableRow attributes={[t(commonMessages.fields.expires_at)]} values={[issuanceInfo.expiryDate]} />
          <TableRow
            attributes={[
              t(commonMessages.fields.issuing_country),
              t(commonMessages.credentials.mdl.un_distinguishing_sign),
            ]}
            values={[issuanceInfo.issuingCountry, issuanceInfo.unDistinguishingSign]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}
