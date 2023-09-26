import type { CredentialForDisplayId } from './hooks'
import type { W3cCredentialJson, W3cIssuerJson } from './types'
import type { CredentialExchangeRecord, W3cCredentialRecord } from '@aries-framework/core'
import type { OpenId4VcCredentialMetadata } from '@internal/openid4vc-client'

import { ClaimFormat, JsonTransformer } from '@aries-framework/core'
import { getOpenId4VcCredentialMetadata } from '@internal/openid4vc-client'
import { sanitizeString, getHostNameFromUrl } from '@internal/utils'

import { getDidCommCredentialExchangeDisplayMetadata } from './didcomm/metadata'

type JffW3cCredentialJson = W3cCredentialJson & {
  name?: string
  description?: string
  credentialBranding?: {
    backgroundColor?: string
  }

  issuer:
    | string
    | (W3cIssuerJson & {
        name?: string
        iconUrl?: string
        logoUrl?: string
        image?: string | { id?: string; type?: 'Image' }
      })
}

export interface DisplayImage {
  url?: string
  altText?: string
}

export interface CredentialDisplay {
  name: string
  locale?: string
  description?: string
  textColor?: string
  backgroundColor?: string
  backgroundImage?: DisplayImage
  issuer: CredentialIssuerDisplay
}

export interface CredentialIssuerDisplay {
  name: string
  locale?: string
  logo?: DisplayImage
}

function findDisplay<Display extends { locale?: string }>(
  display?: Display[]
): Display | undefined {
  if (!display) return undefined

  let item = display.find((d) => d.locale?.startsWith('en-'))
  if (!item) item = display.find((d) => !d.locale)
  if (!item) item = display[0]

  return item
}

function getIssuerDisplay(
  credential: W3cCredentialJson,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
): CredentialIssuerDisplay {
  const issuerDisplay: Partial<CredentialIssuerDisplay> = {}

  // Try to extract from openid metadata first
  if (openId4VcMetadata) {
    const openidIssuerDisplay = findDisplay(openId4VcMetadata.issuer.display)

    if (openidIssuerDisplay) {
      issuerDisplay.name = openidIssuerDisplay.name

      if (openidIssuerDisplay.logo) {
        issuerDisplay.logo = {
          url: openidIssuerDisplay.logo?.url,
          altText: openidIssuerDisplay.logo?.alt_text,
        }
      }
    }

    // If the credentialDisplay contains a logo, and the issuerDisplay does not, use the logo from the credentialDisplay
    const openidCredentialDisplay = findDisplay(openId4VcMetadata.credential.display)
    if (openidCredentialDisplay && !issuerDisplay.logo && openidCredentialDisplay.logo) {
      issuerDisplay.logo = {
        url: openidCredentialDisplay.logo?.url,
        altText: openidCredentialDisplay.logo?.alt_text,
      }
    }
  }

  // If openid metadata is not available, try to extract display metadata from the credential based on JFF metadata
  const jffCredential = credential as JffW3cCredentialJson
  const issuerJson = typeof jffCredential.issuer === 'string' ? undefined : jffCredential.issuer

  // Issuer Display from JFF
  if (!issuerDisplay.logo || !issuerDisplay.logo.url) {
    if (issuerJson?.logoUrl) {
      issuerDisplay.logo = {
        url: issuerJson?.logoUrl,
      }
    } else if (issuerJson?.image) {
      issuerDisplay.logo = {
        url: typeof issuerJson.image === 'string' ? issuerJson.image : issuerJson.image.id,
      }
    }
  }

  // Issuer name from JFF
  if (!issuerDisplay.name) {
    issuerDisplay.name = issuerJson?.name
  }

  // Last fallback: use issuer id from openid4vc
  if (!issuerDisplay.name && openId4VcMetadata?.issuer.id) {
    issuerDisplay.name = getHostNameFromUrl(openId4VcMetadata.issuer.id)
  }

  return {
    ...issuerDisplay,
    name: issuerDisplay.name ?? 'Unknown',
  }
}

function getW3cCredentialDisplay(
  credential: W3cCredentialJson,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
) {
  const credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    const openidCredentialDisplay = findDisplay(openId4VcMetadata.credential.display)

    if (openidCredentialDisplay) {
      credentialDisplay.name = openidCredentialDisplay.name
      credentialDisplay.description = openidCredentialDisplay.description
      credentialDisplay.textColor = openidCredentialDisplay.text_color
      credentialDisplay.backgroundColor = openidCredentialDisplay.background_color

      if (openidCredentialDisplay.background_image) {
        credentialDisplay.backgroundImage = {
          url: openidCredentialDisplay.background_image.url,
          altText: openidCredentialDisplay.background_image.alt_text,
        }
      }

      // NOTE: logo is used in issuer display (not sure if that's right though)
    }
  }

  // If openid metadata is not available, try to extract display metadata from the credential based on JFF metadata
  const jffCredential = credential as JffW3cCredentialJson

  if (!credentialDisplay.name) {
    credentialDisplay.name = jffCredential.name
  }

  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  if (!credentialDisplay.name && jffCredential.type.length > 1) {
    const lastType = jffCredential.type[jffCredential.type.length - 1]
    if (lastType && !lastType.startsWith('http')) {
      credentialDisplay.name = sanitizeString(lastType)
    }
  }

  return {
    ...credentialDisplay,
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
}

export function getCredentialExchangeForDisplay(
  credentialExchangeRecord: CredentialExchangeRecord
) {
  const didCommDisplayMetadata =
    getDidCommCredentialExchangeDisplayMetadata(credentialExchangeRecord)

  return {
    id: `credential-exchange-${credentialExchangeRecord.id}` satisfies CredentialForDisplayId,
    createdAt: credentialExchangeRecord.createdAt,
    display: {
      issuer: {
        name: didCommDisplayMetadata?.issuerName ?? 'Unknown',
      },
      name: didCommDisplayMetadata?.credentialName ?? 'Credential',
    } as CredentialDisplay,
    attributes: Object.fromEntries(
      credentialExchangeRecord.credentialAttributes?.map(({ name, value }) => [name, value]) ?? []
    ) satisfies Record<string, unknown>,
  }
}

export function getW3cCredentialForDisplay(w3cCredentialRecord: W3cCredentialRecord) {
  const credential = JsonTransformer.toJSON(
    w3cCredentialRecord.credential.claimFormat === ClaimFormat.JwtVc
      ? w3cCredentialRecord.credential.credential
      : w3cCredentialRecord.credential
  ) as W3cCredentialJson

  const openId4VcMetadata = getOpenId4VcCredentialMetadata(w3cCredentialRecord)
  const issuerDisplay = getIssuerDisplay(credential, openId4VcMetadata)
  const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

  // FIXME: support credential with multiple subjects
  const credentialAttributes = Array.isArray(credential.credentialSubject)
    ? credential.credentialSubject[0] ?? {}
    : credential.credentialSubject

  return {
    id: `w3c-credential-${w3cCredentialRecord.id}` satisfies CredentialForDisplayId,
    createdAt: w3cCredentialRecord.createdAt,
    display: {
      ...credentialDisplay,
      issuer: issuerDisplay,
    },
    w3cCredential: credential,
    attributes: credentialAttributes,
  }
}
