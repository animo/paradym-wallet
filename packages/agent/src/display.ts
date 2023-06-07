import type { W3cCredentialJson, W3cIssuerJson } from './types'
import type { W3cCredentialRecord } from '@aries-framework/core'

import { ClaimFormat, JsonTransformer } from '@aries-framework/core'
import { sanitizeString } from '@internal/utils'

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

export interface W3cCredentialDisplay {
  name: string
  locale?: string
  description?: string
  textColor?: string
  backgroundColor?: string
  backgroundImage?: {
    url?: string
    altText?: string
  }

  issuer: W3cCredentialIssuerDisplay
}

export interface W3cCredentialIssuerDisplay {
  name: string
  locale?: string
  logo?: {
    url?: string
    altText?: string
  }
}

export function getCredentialForDisplay(w3cCredentialRecord: W3cCredentialRecord): {
  credential: W3cCredentialJson
  display: W3cCredentialDisplay
} {
  const credential = JsonTransformer.toJSON(
    w3cCredentialRecord.credential.claimFormat === ClaimFormat.JwtVc
      ? w3cCredentialRecord.credential.credential
      : w3cCredentialRecord.credential
  ) as W3cCredentialJson

  // TODO: Implement this in AFJ
  // 1. try to extract display metadata from the credential record

  // 2. if not available, try to extract display metadata from the credential based on JFF metadata
  const jffCredential = credential as JffW3cCredentialJson
  const issuerJson = typeof jffCredential.issuer === 'string' ? undefined : jffCredential.issuer

  let issuerLogoUrl = issuerJson?.logoUrl
  if (!issuerLogoUrl && issuerJson?.image) {
    issuerLogoUrl = typeof issuerJson.image === 'string' ? issuerJson.image : issuerJson.image.id
  }

  let credentialName = jffCredential.name

  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  if (!credentialName && jffCredential.type.length > 1) {
    const lastType = jffCredential.type[jffCredential.type.length - 1]
    if (lastType && !lastType.startsWith('http')) {
      credentialName = sanitizeString(lastType)
    }
  }

  // Last fallback, if there's really no name for the credential, we use a generic name
  // TODO: use on-device AI to determine a name for the credential based on the credential data
  if (!credentialName) {
    credentialName = 'Credential'
  }

  return {
    display: {
      backgroundColor: jffCredential.credentialBranding?.backgroundColor,
      description: jffCredential.description,
      name: credentialName,
      issuer: {
        name: issuerJson?.name ?? 'Unknown',
        logo: {
          url: issuerLogoUrl,
        },
      },
    },
    credential,
  }
}
