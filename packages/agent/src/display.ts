import type { W3cCredentialJson, W3cIssuerJson } from './types'
import type { W3cCredentialRecord } from '@aries-framework/core'

import { JsonTransformer } from '@aries-framework/core'

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
        image?: string
      })
}

export interface W3cCredentialDisplay {
  name?: string
  locale?: string
  description?: string
  textColor?: string
  backgroundColor?: string
  backgroundImage?: {
    url?: string
    altText?: string
  }

  issuer?: W3cCredentialIssuerDisplay
}

export interface W3cCredentialIssuerDisplay {
  name?: string
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
  const credential = JsonTransformer.toJSON(w3cCredentialRecord.credential) as W3cCredentialJson

  // TODO: Implement this in AFJ
  // 1. try to extract display metadata from the credential record

  // 2. if not available, try to extract display metadata from the credential based on JFF metadata
  const jffCredential = credential as JffW3cCredentialJson
  const issuerJson = typeof jffCredential.issuer === 'string' ? undefined : jffCredential.issuer

  return {
    display: {
      backgroundColor: jffCredential.credentialBranding?.backgroundColor,
      description: jffCredential.description,
      name: jffCredential.name,
      issuer: {
        name: issuerJson?.name,
        logo: {
          url: issuerJson?.logoUrl,
        },
      },
    },
    credential,
  }
}
