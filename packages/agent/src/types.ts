import type { LinkedDataProof } from '@aries-framework/core/build/modules/vc/data-integrity/models/LinkedDataProof'

// Temp types to work with until we have the correct ones.

export type W3cIssuer = {
  id: string
  name: string
  iconUrl: string
  logoUrl: string
  image: string
}

export type W3cCredentialSubject = {
  id?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export type W3cCredential = {
  type: Array<string>
  issuer: W3cIssuer
  name: string
  description: string
  credentialBranding?: {
    backgroundColor: string
  }
  issuanceDate: string
  expiryDate?: string
  credentialSubject: W3cCredentialSubject
  proof: LinkedDataProof | LinkedDataProof[]
}

export type MattrW3cCredentialRecord = {
  id: string
  createdAt?: Date
  credential: W3cCredential
  updatedAt?: Date
}

// To be used for styling
export type W3cCredentialDisplay = {
  name: string
  locale?: string
  logo?: {
    url?: string
    altText?: string
  }
  description?: string
  background_color?: string
  text_color?: string
}
