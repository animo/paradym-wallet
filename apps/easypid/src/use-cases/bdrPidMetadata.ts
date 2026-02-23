import type { SdJwtVcTypeMetadata } from '@credo-ts/core'
import type { OpenId4VcCredentialMetadata } from '@package/agent'

export const bdrPidCredentialDisplay = {
  name: 'Personalausweis',
  backgroundImage: 'pid_background',
  backgroundColor: '#F1F2F0',
  textColor: '#2F3544',
}

export const bdrPidIssuerDisplay = {
  logo: 'german_issuer_image',
  name: 'Bundesdruckerei',
}

export const bdrPidOpenId4VcMetadata = (credentialIssuer: string): OpenId4VcCredentialMetadata => {
  return {
    issuer: {
      id: credentialIssuer,
      display: [
        {
          locale: 'en-US',
          name: bdrPidIssuerDisplay.name,
          logo: {
            uri: bdrPidIssuerDisplay.logo,
          },
        },
      ],
    },
    credential: {
      display: [
        {
          name: bdrPidCredentialDisplay.name,
          background_color: bdrPidCredentialDisplay.backgroundColor,
          text_color: bdrPidCredentialDisplay.textColor,
          background_image: {
            uri: bdrPidCredentialDisplay.backgroundImage,
          },
          locale: 'en-US',
        },
      ],
    },
  }
}

export const bdrPidSdJwtTypeMetadata: SdJwtVcTypeMetadata = {
  vct: 'https://demo.pid-issuer.bundesdruckerei.de/credentials/pid/1.0',
  name: 'German Person Identification Data Credential - First Version',
  description:
    'The definition of the core identification credential for all natural persons in Germany - first revision',
  display: [
    {
      locale: 'en-US',
      // Name from pid metadata is very long?!?
      // name: 'German Person Identification Data Credential',
      // description: 'The core identification credential for all natural persons in Germany',
      name: bdrPidCredentialDisplay.name,

      rendering: {
        svg_templates: undefined,
        simple: {
          background_color: bdrPidCredentialDisplay.backgroundColor,
          text_color: bdrPidCredentialDisplay.textColor,
          logo: {
            // TODO: can we store local file path in a record? I think we might have to
            // add an identifier and replace it before rendering..
            // FIXME:
            uri: bdrPidCredentialDisplay.backgroundImage as unknown as string,
          },
        },
      },
    },
    {
      locale: 'de-DE',
      name: 'Deutscher Personenidentifikationsnachweis',
      description: 'Der zentrale Identifikationsnachweis für alle natürlichen Personen in Deutschland',
    },
  ],
  claims: [
    {
      path: ['vct'],
      sd: 'never',
    },
    {
      path: ['vct#integrity'],
      sd: 'never',
    },
    {
      path: ['given_name'],
      display: [
        {
          locale: 'de-DE',
          label: 'Vorname',
        },
        {
          locale: 'en-US',
          label: 'Given Name',
        },
      ],
      sd: 'always',
    },
    {
      path: ['family_name'],
      display: [
        {
          locale: 'de-DE',
          label: 'Nachname',
        },
        {
          locale: 'en-US',
          label: 'Last Name',
        },
      ],
      sd: 'always',
    },
    {
      path: ['birthdate'],
      display: [
        {
          locale: 'de-DE',
          label: 'Geburtsdatum',
        },
        {
          locale: 'en-US',
          label: 'Birthdate',
        },
      ],
      sd: 'always',
    },
    {
      path: ['source_document_type'],
      display: [
        {
          locale: 'de-DE',
          label: 'Quelldokumenttyp',
          description: 'Der Typ der Quelle des Dokumentes, beispielweise der Personalausweis oder der Aufenthaltstitel',
        },
        {
          locale: 'en-US',
          label: 'Source Document Type',
          description:
            'The type of the source of the document, for example the national identity card or the residence title',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address'],
      display: [
        {
          locale: 'de-DE',
          label: 'Adresse',
        },
        {
          locale: 'en-US',
          label: 'Address',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'street_address'],
      display: [
        {
          locale: 'de-DE',
          label: 'Straße',
        },
        {
          locale: 'en-US',
          label: 'Street Address',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'locality'],
      display: [
        {
          locale: 'de-DE',
          label: 'Ort',
        },
        {
          locale: 'en-US',
          label: 'Locality',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'postal_code'],
      display: [
        {
          locale: 'de-DE',
          label: 'Postleitzahl',
        },
        {
          locale: 'en-US',
          label: 'Postal Code',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'country'],
      display: [
        {
          locale: 'de-DE',
          label: 'Land',
        },
        {
          locale: 'en-US',
          label: 'Country',
        },
      ],
      sd: 'always',
    },
    {
      path: ['nationalities'],
      display: [
        {
          locale: 'de-DE',
          label: 'Staatsangehörigkeiten',
        },
        {
          locale: 'en-US',
          label: 'Nationalities',
        },
      ],
      sd: 'always',
    },
    {
      path: ['gender'],
      display: [
        {
          locale: 'de-DE',
          label: 'Geschlecht',
        },
        {
          locale: 'en-US',
          label: 'Gender',
        },
      ],
      sd: 'always',
    },
    {
      path: ['birth_family_name'],
      display: [
        {
          locale: 'de-DE',
          label: 'Geburtsname',
        },
        {
          locale: 'en-US',
          label: 'Family Name at Birth',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth'],
      display: [
        {
          locale: 'de-DE',
          label: 'Geburtsort',
        },
        {
          locale: 'en-US',
          label: 'Place of Birth',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth', 'locality'],
      display: [
        {
          locale: 'de-DE',
          label: 'Geburtsort',
        },
        {
          locale: 'en-US',
          label: 'Place of Birth',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth', 'locality'],
      display: [
        {
          locale: 'de-DE',
          label: 'Ort',
        },
        {
          locale: 'en-US',
          label: 'Locality',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth', 'country'],
      display: [
        {
          locale: 'de-DE',
          label: 'Land',
        },
        {
          locale: 'en-US',
          label: 'Country',
        },
      ],
      sd: 'always',
    },
    {
      path: ['also_known_as'],
      display: [
        {
          locale: 'de-DE',
          label: 'Ordens- oder Künstlername',
        },
        {
          locale: 'en-US',
          label: 'Religious Name or Pseudonym',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over'],
      display: [
        {
          locale: 'de-DE',
          label: 'Altersbestätigung',
        },
        {
          locale: 'en-US',
          label: 'Age Verification',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '12'],
      display: [
        {
          locale: 'de-DE',
          label: 'Mindestalter 12',
        },
        {
          locale: 'en-US',
          label: 'Minimum Age 12',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '14'],
      display: [
        {
          locale: 'de-DE',
          label: 'Mindestalter 14',
        },
        {
          locale: 'en-US',
          label: 'Minimum Age 14',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '16'],
      display: [
        {
          locale: 'de-DE',
          label: 'Mindestalter 16',
        },
        {
          locale: 'en-US',
          label: 'Minimum Age 16',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '18'],
      display: [
        {
          locale: 'de-DE',
          label: 'Mindestalter 18',
        },
        {
          locale: 'en-US',
          label: 'Minimum Age 18',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '21'],
      display: [
        {
          locale: 'de-DE',
          label: 'Mindestalter 21',
        },
        {
          locale: 'en-US',
          label: 'Minimum Age 21',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '65'],
      display: [
        {
          locale: 'de-DE',
          label: 'Mindestalter 65',
        },
        {
          locale: 'en-US',
          label: 'Minimum Age 65',
        },
      ],
      sd: 'always',
    },
    {
      path: ['cnf'],
      sd: 'never',
    },
    {
      path: ['iat'],
      display: [
        {
          locale: 'de-DE',
          label: 'Ausstellungsdatum',
        },
        {
          locale: 'en-US',
          label: 'Issuing Date',
        },
      ],
      sd: 'never',
    },
    {
      path: ['exp'],
      display: [
        {
          locale: 'de-DE',
          label: 'Ablaufdatum',
        },
        {
          locale: 'en-US',
          label: 'Expiry Date',
        },
      ],
      sd: 'never',
    },
    {
      path: ['issuing_authority'],
      display: [
        {
          locale: 'de-DE',
          label: 'Ausstellende Behörde',
        },
        {
          locale: 'en-US',
          label: 'Issuing Authority',
        },
      ],
      sd: 'never',
    },
    {
      path: ['issuing_country'],
      display: [
        {
          locale: 'de-DE',
          label: 'Ausstellungsland',
        },
        {
          locale: 'en-US',
          label: 'Issuing Country',
        },
      ],
      sd: 'never',
    },
  ],
}
