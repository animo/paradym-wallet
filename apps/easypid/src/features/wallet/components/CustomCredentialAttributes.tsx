import { mdlSchemes, pidSchemes } from '@easypid/constants'
import { useCredentialByCategory } from '@easypid/hooks/useCredentialByCategory'
import { type MdlSdJwtVcAttributes, getImageForMdlCode, mapMdlAttributeName } from '@easypid/utils/mdl_metadata'
import { type PidSdJwtVcAttributes, mapPidAttributeName } from '@easypid/utils/pid_metadata'
import { CredentialAttributes, type CredentialAttributesProps } from '@package/app/src'
import { Circle, Heading, Image, Paragraph, Stack, TableContainer, TableRow, XStack, YStack } from 'packages/ui/src'
import { formatDate } from 'packages/utils/src'

import mdlCodeD from '../../../../assets/mdl/code-d.png'

type CustomCredentialAttributesProps = CredentialAttributesProps & {
  type: string
}

export function CustomCredentialAttributes({ type, ...props }: CustomCredentialAttributesProps) {
  if (pidSchemes.sdJwtVcVcts.includes(type)) {
    return <FunkePidCredentialAttributes />
  }
  if (mdlSchemes.mdlJwtVcVcts.includes(type)) {
    return <FunkeMdlCredentialAttributes />
  }
  return <CredentialAttributes {...props} />
}

export function FunkePidCredentialAttributes() {
  const { credential } = useCredentialByCategory('DE-PID')

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

// TODO: Improve background/card design for MDL
export function FunkeMdlCredentialAttributes() {
  const { credential } = useCredentialByCategory('DE-MDL')

  const typedRawAttrs = credential?.rawAttributes as MdlSdJwtVcAttributes

  const mainCardStrings = {
    name: `${typedRawAttrs.given_name} ${typedRawAttrs.family_name}`,
    privileges: typedRawAttrs.driving_privileges.map((privilege) => privilege.vehicle_category_code).join(', '),
    documentNumber: typedRawAttrs.document_number,
  }

  const issueStrings = {
    issuingAuthority: typedRawAttrs.issuing_authority,
    issuingCountry: typedRawAttrs.issuing_country,
    expiryDate: formatDate(typedRawAttrs.expiry_date, { includeTime: false }),
    unDistinguishingSign: typedRawAttrs.un_distinguishing_sign,
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
            <Image width={96} height={96} src={typedRawAttrs.portrait} />
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
                <Paragraph>Führerschein</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={[mapMdlAttributeName('privileges'), mapMdlAttributeName('document_number')]}
              values={[
                <XStack key="driving-privileges-icons" gap="$3">
                  {typedRawAttrs.driving_privileges.map((privilege) => (
                    <Image
                      key={privilege.vehicle_category_code}
                      src={getImageForMdlCode(privilege.vehicle_category_code)}
                      width={36}
                      height={28}
                    />
                  ))}
                </XStack>,
                mainCardStrings.documentNumber,
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
          {typedRawAttrs.driving_privileges.map((privilege) => (
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
                privilege.expiry_date,
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
          <TableRow attributes={[mapMdlAttributeName('issuing_authority')]} values={[issueStrings.issuingAuthority]} />
          <TableRow attributes={[mapMdlAttributeName('expiry_date')]} values={[issueStrings.expiryDate]} />
          <TableRow
            attributes={[mapMdlAttributeName('issuing_country'), mapMdlAttributeName('un_distinguishing_sign')]}
            values={[issueStrings.issuingCountry, issueStrings.unDistinguishingSign]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}
