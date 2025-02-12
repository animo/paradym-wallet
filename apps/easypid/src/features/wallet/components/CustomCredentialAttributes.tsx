import { usePidCredential } from '@easypid/hooks/usePidCredential'
import { CredentialAttributes, type CredentialAttributesProps } from '@package/app/src'
import { Circle, Heading, Image, Paragraph, Stack, TableContainer, TableRow, YStack } from 'packages/ui/src'
const PID_TYPE = 'https://demo.pid-issuer.bundesdruckerei.de/credentials/pid/1.0'

type CustomCredentialAttributesProps = CredentialAttributesProps & {
  type: string
}

export function CustomCredentialAttributes({ type, ...props }: CustomCredentialAttributesProps) {
  if (type === PID_TYPE) {
    return <FunkePidCredentialAttributes subject={props.subject} />
  }
  return <CredentialAttributes {...props} />
}

// TODO: Get fix typing of custom attributes
// TODO: Add option to show all attributes (including hidden ones)
// TODO: Add custom view for MDL
// TODO: Improve background/card design for MDL

export function FunkePidCredentialAttributes({ subject }: CredentialAttributesProps) {
  const { credential } = usePidCredential()
  const typedAttrs = subject

  const profileAttrs = {
    name: `${typedAttrs['Given name']} ${typedAttrs['Family name']}`,
    dateOfBirth: `born ${typedAttrs['Birthdate']} (${typedAttrs['Age']})`,
    placeOfBirth: typedAttrs['Place of geboorte']?.locality ?? '',
    nationalities: typedAttrs['Nationalities']?.join(', ') ?? '',
  }

  const addressAttrs = {
    street: typedAttrs.Address?.Street ?? '',
    locality: `${typedAttrs.Address?.Locality} (${typedAttrs.Address?.Country})`,
    postalCode: typedAttrs.Address?.['Postal code'] ?? '',
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
                <Heading variant="h3">{profileAttrs.name}</Heading>
                <Paragraph>{profileAttrs.dateOfBirth}</Paragraph>
              </YStack>
            </YStack>
            <TableRow
              centred
              attributes={['Place of Geboorte', 'Nationalities']}
              values={[profileAttrs.placeOfBirth, profileAttrs.nationalities]}
            />
          </TableContainer>
        </Stack>
      </YStack>
      <YStack gap="$2">
        <Heading variant="sub2" secondary>
          Address
        </Heading>
        <TableContainer>
          <TableRow attributes={['Street']} values={[addressAttrs.street]} />
          <TableRow
            attributes={['Postal code', 'Locality']}
            values={[addressAttrs.postalCode, addressAttrs.locality]}
          />
        </TableContainer>
      </YStack>
    </Stack>
  )
}
