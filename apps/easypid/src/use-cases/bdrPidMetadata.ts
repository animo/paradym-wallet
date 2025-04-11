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
            // FIXME
            uri: bdrPidIssuerDisplay.logo as unknown as string,
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
            // FIXME
            uri: bdrPidCredentialDisplay.backgroundImage as unknown as string,
          },
          locale: 'en-US',
        },
      ],
    },
  }
}

export const bdrPidSdJwtTypeMetadata: SdJwtVcTypeMetadata = {
  // TODO: add vct to type interface in Credo
  // vct: 'https://metadata-8c062a.usercontent.opencode.de/pid.json',
  name: 'German Person Identification Data Credential - First Version',
  description:
    'The definition of the core identification credential for all natural persons in Germany - first revision',
  display: [
    {
      lang: 'en-US',
      // Name from pid metadata is very long?!?
      // name: 'German Person Identification Data Credential',
      // description: 'The core identification credential for all natural persons in Germany',
      name: bdrPidCredentialDisplay.name,
      rendering: {
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
      lang: 'de-DE',
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
          lang: 'de-DE',
          label: 'Vorname',
        },
        {
          lang: 'en-US',
          label: 'Given Name',
        },
      ],
      sd: 'always',
    },
    {
      path: ['family_name'],
      display: [
        {
          lang: 'de-DE',
          label: 'Nachname',
        },
        {
          lang: 'en-US',
          label: 'Last Name',
        },
      ],
      sd: 'always',
    },
    {
      path: ['birthdate'],
      display: [
        {
          lang: 'de-DE',
          label: 'Geburtsdatum',
        },
        {
          lang: 'en-US',
          label: 'Birthdate',
        },
      ],
      sd: 'always',
    },
    {
      path: ['source_document_type'],
      display: [
        {
          lang: 'de-DE',
          label: 'Quelldokumenttyp',
          description: 'Der Typ der Quelle des Dokumentes, beispielweise der Personalausweis oder der Aufenthaltstitel',
        },
        {
          lang: 'en-US',
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
          lang: 'de-DE',
          label: 'Adresse',
        },
        {
          lang: 'en-US',
          label: 'Address',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'street_address'],
      display: [
        {
          lang: 'de-DE',
          label: 'Straße',
        },
        {
          lang: 'en-US',
          label: 'Street Address',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'locality'],
      display: [
        {
          lang: 'de-DE',
          label: 'Ort',
        },
        {
          lang: 'en-US',
          label: 'Locality',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'postal_code'],
      display: [
        {
          lang: 'de-DE',
          label: 'Postleitzahl',
        },
        {
          lang: 'en-US',
          label: 'Postal Code',
        },
      ],
      sd: 'always',
    },
    {
      path: ['address', 'country'],
      display: [
        {
          lang: 'de-DE',
          label: 'Land',
        },
        {
          lang: 'en-US',
          label: 'Country',
        },
      ],
      sd: 'always',
    },
    {
      path: ['nationalities'],
      display: [
        {
          lang: 'de-DE',
          label: 'Staatsangehörigkeiten',
        },
        {
          lang: 'en-US',
          label: 'Nationalities',
        },
      ],
      sd: 'always',
    },
    {
      path: ['gender'],
      display: [
        {
          lang: 'de-DE',
          label: 'Geschlecht',
        },
        {
          lang: 'en-US',
          label: 'Gender',
        },
      ],
      sd: 'always',
    },
    {
      path: ['birth_family_name'],
      display: [
        {
          lang: 'de-DE',
          label: 'Geburtsname',
        },
        {
          lang: 'en-US',
          label: 'Family Name at Birth',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth'],
      display: [
        {
          lang: 'de-DE',
          label: 'Geburtsort',
        },
        {
          lang: 'en-US',
          label: 'Place of Birth',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth', 'locality'],
      display: [
        {
          lang: 'de-DE',
          label: 'Geburtsort',
        },
        {
          lang: 'en-US',
          label: 'Place of Birth',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth', 'locality'],
      display: [
        {
          lang: 'de-DE',
          label: 'Ort',
        },
        {
          lang: 'en-US',
          label: 'Locality',
        },
      ],
      sd: 'always',
    },
    {
      path: ['place_of_birth', 'country'],
      display: [
        {
          lang: 'de-DE',
          label: 'Land',
        },
        {
          lang: 'en-US',
          label: 'Country',
        },
      ],
      sd: 'always',
    },
    {
      path: ['also_known_as'],
      display: [
        {
          lang: 'de-DE',
          label: 'Ordens- oder Künstlername',
        },
        {
          lang: 'en-US',
          label: 'Religious Name or Pseudonym',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over'],
      display: [
        {
          lang: 'de-DE',
          label: 'Altersbestätigung',
        },
        {
          lang: 'en-US',
          label: 'Age Verification',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '12'],
      display: [
        {
          lang: 'de-DE',
          label: 'Mindestalter 12',
        },
        {
          lang: 'en-US',
          label: 'Minimum Age 12',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '14'],
      display: [
        {
          lang: 'de-DE',
          label: 'Mindestalter 14',
        },
        {
          lang: 'en-US',
          label: 'Minimum Age 14',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '16'],
      display: [
        {
          lang: 'de-DE',
          label: 'Mindestalter 16',
        },
        {
          lang: 'en-US',
          label: 'Minimum Age 16',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '18'],
      display: [
        {
          lang: 'de-DE',
          label: 'Mindestalter 18',
        },
        {
          lang: 'en-US',
          label: 'Minimum Age 18',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '21'],
      display: [
        {
          lang: 'de-DE',
          label: 'Mindestalter 21',
        },
        {
          lang: 'en-US',
          label: 'Minimum Age 21',
        },
      ],
      sd: 'always',
    },
    {
      path: ['age_equal_or_over', '65'],
      display: [
        {
          lang: 'de-DE',
          label: 'Mindestalter 65',
        },
        {
          lang: 'en-US',
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
          lang: 'de-DE',
          label: 'Ausstellungsdatum',
        },
        {
          lang: 'en-US',
          label: 'Issuing Date',
        },
      ],
      sd: 'never',
    },
    {
      path: ['exp'],
      display: [
        {
          lang: 'de-DE',
          label: 'Ablaufdatum',
        },
        {
          lang: 'en-US',
          label: 'Expiry Date',
        },
      ],
      sd: 'never',
    },
    {
      path: ['issuing_authority'],
      display: [
        {
          lang: 'de-DE',
          label: 'Ausstellende Behörde',
        },
        {
          lang: 'en-US',
          label: 'Issuing Authority',
        },
      ],
      sd: 'never',
    },
    {
      path: ['issuing_country'],
      display: [
        {
          lang: 'de-DE',
          label: 'Ausstellungsland',
        },
        {
          lang: 'en-US',
          label: 'Issuing Country',
        },
      ],
      sd: 'never',
    },
  ],
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'German Person Identification Data VCT Schema',
    description: 'The JSON schema that defines the German Person Identification Data VCT',
    type: 'object',
    properties: {
      vct: {
        type: 'string',
      },
      'vct#integrity': {
        type: 'string',
      },
      given_name: {
        type: 'string',
      },
      family_name: {
        type: 'string',
      },
      birthdate: {
        type: 'string',
        format: 'date',
      },
      source_document_type: {
        type: 'string',
      },
      address: {
        type: 'object',
        properties: {
          street_address: {
            type: 'string',
          },
          locality: {
            type: 'string',
          },
          postal_code: {
            type: 'string',
          },
          country: {
            type: 'string',
          },
        },
        minProperties: 1,
      },
      nationalities: {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 1,
        uniqueItems: true,
      },
      gender: {
        type: 'string',
      },
      birth_family_name: {
        type: 'string',
      },
      place_of_birth: {
        type: 'object',
        properties: {
          locality: {
            type: 'string',
          },
          country: {
            type: 'string',
          },
        },
        minProperties: 1,
      },
      also_known_as: {
        type: 'string',
      },
      age_equal_or_over: {
        type: 'object',
        properties: {
          '12': {
            type: 'boolean',
          },
          '14': {
            type: 'boolean',
          },
          '16': {
            type: 'boolean',
          },
          '18': {
            type: 'boolean',
          },
          '21': {
            type: 'boolean',
          },
          '65': {
            type: 'boolean',
          },
        },
        minProperties: 1,
      },
      cnf: {
        type: 'object',
      },
      iat: {
        type: 'number',
      },
      exp: {
        type: 'number',
      },
      issuing_authority: {
        type: 'string',
      },
      issuing_country: {
        type: 'string',
      },
    },
    required: ['vct', 'source_document_type', 'cnf', 'iat', 'exp', 'issuing_authority', 'issuing_country'],
  },
}
