import { type ClaimFormat, MdocRecord, SdJwtVcRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '@credo-ts/core'
import { ParadymWalletUnsupportedCredentialRecordTypeError } from '../error'
import {
  type CredentialCategoryMetadata,
  getCredentialCategoryMetadata,
  getRefreshCredentialMetadata,
} from '../metadata/credentials'
import type { CredentialRecord } from '../storage/credentials'
import { getDisplayInformationForMdocCredential } from './mdoc'
import { getDisplayInformationForSdJwtCredential } from './sdJwt'
import { getDisplayInformationForW3cCredential, getDisplayInformationForW3cV2Credential } from './w3c'

export type CredentialForDisplayId =
  | `w3c-credential-${string}`
  | `sd-jwt-vc-${string}`
  | `mdoc-${string}`
  | `w3c-v2-credential-${string}`

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
  domain?: string
  locale?: string
  logo?: DisplayImage
}

export interface CredentialMetadata {
  /**
   * vct (sd-jwt) or doctype (mdoc) or last type entry (w3c)
   */
  type: string

  /**
   * issuer identifier. did or https url
   */
  issuer?: string

  /**
   * Holder identifier. did or jwk thubmprint
   */
  holder?: string

  validUntil?: string
  validFrom?: string
  issuedAt?: string

  hasRefreshToken?: boolean

  // TODO: define and render
  status?: unknown
}

export interface CredentialForDisplay {
  id: CredentialForDisplayId
  createdAt: Date
  display: CredentialDisplay
  attributes: Record<string, unknown>
  rawAttributes: Record<string, unknown>
  metadata: CredentialMetadata
  claimFormat:
    | ClaimFormat.SdJwtDc
    | ClaimFormat.SdJwtW3cVc
    | ClaimFormat.JwtW3cVc
    | ClaimFormat.MsoMdoc
    | ClaimFormat.JwtVc
    | ClaimFormat.LdpVc
  record: CredentialRecord

  category?: CredentialCategoryMetadata
  hasRefreshToken: boolean
}

export function getCredentialForDisplayId(credentialRecord: CredentialRecord): CredentialForDisplayId {
  if (credentialRecord instanceof SdJwtVcRecord) {
    return `sd-jwt-vc-${credentialRecord.id}`
  }
  if (credentialRecord instanceof W3cCredentialRecord) {
    return `w3c-credential-${credentialRecord.id}`
  }
  if (credentialRecord instanceof W3cV2CredentialRecord) {
    return `w3c-v2-credential-${credentialRecord.id}`
  }
  if (credentialRecord instanceof MdocRecord) {
    return `mdoc-${credentialRecord.id}`
  }

  throw new ParadymWalletUnsupportedCredentialRecordTypeError()
}

export function getCredentialForDisplay(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord | W3cV2CredentialRecord
): CredentialForDisplay {
  const credentialCategoryMetadata = getCredentialCategoryMetadata(credentialRecord) ?? undefined
  const credentialForDisplayId = getCredentialForDisplayId(credentialRecord)
  const hasRefreshToken = getRefreshCredentialMetadata(credentialRecord) !== null

  if (credentialRecord instanceof SdJwtVcRecord) {
    return getDisplayInformationForSdJwtCredential(
      credentialRecord,
      credentialForDisplayId,
      hasRefreshToken,
      credentialCategoryMetadata
    )
  }
  if (credentialRecord instanceof MdocRecord) {
    return getDisplayInformationForMdocCredential(
      credentialRecord,
      credentialForDisplayId,
      hasRefreshToken,
      credentialCategoryMetadata
    )
  }
  if (credentialRecord instanceof W3cCredentialRecord) {
    return getDisplayInformationForW3cCredential(
      credentialRecord,
      credentialForDisplayId,
      hasRefreshToken,
      credentialCategoryMetadata
    )
  }
  if (credentialRecord instanceof W3cV2CredentialRecord) {
    return getDisplayInformationForW3cV2Credential(
      credentialRecord,
      credentialForDisplayId,
      hasRefreshToken,
      credentialCategoryMetadata
    )
  }

  throw new ParadymWalletUnsupportedCredentialRecordTypeError()
}
