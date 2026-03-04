import {
  ClaimFormat,
  JsonTransformer,
  MdocRecord,
  SdJwtVcRecord,
  type SdJwtVcTypeMetadata,
  type SingleOrArray,
  W3cCredentialRecord,
  type W3cJsonCredential,
  W3cV2CredentialRecord,
  type W3cV2JsonCredential,
} from '@credo-ts/core'
import { i18n } from '@package/translations'
import { ParadymWalletUnsupportedCredentialRecordTypeError } from '../error'
import { type FormattedAttribute, findDisplayByLocale, formatAttributesWithRecordMetadata } from '../format/attributes'
import {
  type CredentialCategoryMetadata,
  getCredentialCategoryMetadata,
  getOpenId4VcCredentialMetadata,
  getRefreshCredentialMetadata,
} from '../metadata/credentials'
import type { CredentialRecord } from '../storage/credentials'
import { getAttributesAndMetadataForMdocPayload, getMdocCredentialDisplay } from './mdoc'
import { getOpenId4VcIssuerDisplay } from './openid4vc'
import { getAttributesAndMetadataForSdJwtPayload, getSdJwtCredentialDisplay } from './sdJwt'
import { getW3cCredentialDisplay, getW3cIssuerDisplay } from './w3c'

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
  name?: string
  locale?: string
  description?: string
  textColor?: string
  backgroundColor?: string
  backgroundImage?: DisplayImage
  issuer: CredentialIssuerDisplay
}

export interface CredentialIssuerDisplay {
  name?: string
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
   * E.g. vct extends values
   */
  additionalTypes?: string[]

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
  /**
   * All attributes with claim path ordering applied.
   * Attributes with claim paths are prioritized but all attributes are included.
   */
  attributes: FormattedAttribute[]
  /**
   * Raw attributes exactly as they appear in the credential.
   * Can be used to directly access data from the credential.
   */
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

function _getSdJwtTypeMetadataCredentialDisplay(
  sdJwtTypeMetadata: SdJwtVcTypeMetadata
): Omit<CredentialDisplay, 'issuer' | 'name'> & { name?: string } {
  const typeMetadataDisplay = findDisplayByLocale(sdJwtTypeMetadata.display, i18n.locale)

  // TODO: support SVG rendering method

  const credentialDisplay = {
    name: typeMetadataDisplay?.name,
    description: typeMetadataDisplay?.description,
    textColor: typeMetadataDisplay?.rendering?.simple?.text_color,
    backgroundColor: typeMetadataDisplay?.rendering?.simple?.background_color,
    backgroundImage: typeMetadataDisplay?.rendering?.simple?.logo
      ? {
          url: typeMetadataDisplay?.rendering?.simple?.logo.uri,
          altText: typeMetadataDisplay?.rendering?.simple?.logo.alt_text,
        }
      : undefined,
  }

  return credentialDisplay
}

export function getCredentialForDisplay(credentialRecord: CredentialRecord): CredentialForDisplay {
  const credentialCategoryMetadata = getCredentialCategoryMetadata(credentialRecord)
  const credentialForDisplayId = getCredentialForDisplayId(credentialRecord)
  const hasRefreshToken = getRefreshCredentialMetadata(credentialRecord) !== null

  if (credentialRecord instanceof SdJwtVcRecord) {
    const sdJwtVc = credentialRecord.firstCredential

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const sdJwtTypeMetadata = credentialRecord.typeMetadata
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)

    const credentialDisplay = getSdJwtCredentialDisplay(sdJwtVc.prettyClaims, openId4VcMetadata, sdJwtTypeMetadata)
    const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(sdJwtVc.prettyClaims)

    // Format displayed attributes (only those in claim metadata)
    const formattedAttributes = formatAttributesWithRecordMetadata(attributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,
      rawAttributes: attributes,
      metadata,
      claimFormat: ClaimFormat.SdJwtDc,
      record: credentialRecord,
      category: credentialCategoryMetadata ?? undefined,
      hasRefreshToken,
    }
  }
  if (credentialRecord instanceof MdocRecord) {
    const mdocInstance = credentialRecord.firstCredential

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const credentialDisplay = getMdocCredentialDisplay(mdocInstance, openId4VcMetadata)
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)

    const { attributes, metadata } = getAttributesAndMetadataForMdocPayload(
      mdocInstance.issuerSignedNamespaces,
      mdocInstance
    )

    // Format attributes
    // And then remove the top-layer, as that is the namespace
    const formattedAttributes = formatAttributesWithRecordMetadata(attributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,
      rawAttributes: attributes,
      metadata,
      claimFormat: ClaimFormat.MsoMdoc,
      record: credentialRecord,
      category: credentialCategoryMetadata ?? undefined,
      hasRefreshToken,
    }
  }
  if (credentialRecord instanceof W3cCredentialRecord) {
    const firstCredential = credentialRecord.firstCredential

    const credential = JsonTransformer.toJSON(
      firstCredential.claimFormat === ClaimFormat.JwtVc ? firstCredential.credential : firstCredential.toJson()
    ) as W3cJsonCredential | W3cV2JsonCredential

    // biome-ignore lint/suspicious/noExplicitAny: no explanation
    const proof = (credential as any).proof as SingleOrArray<{
      type: string
      cryptosuite?: string
      verificationMethod?: string
    }>
    const firstProof = Array.isArray(proof) ? proof[0] : proof
    const isAnonCreds = firstProof.cryptosuite === 'anoncreds-2023'

    let type = firstCredential.type[firstCredential.type.length - 1]
    if (isAnonCreds) {
      type = firstProof.verificationMethod ?? type
    }

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const issuerDisplay = getW3cIssuerDisplay(credential, openId4VcMetadata)
    const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

    // FIXME: support credential with multiple subjects
    const credentialAttributes = Array.isArray(credential.credentialSubject)
      ? (credential.credentialSubject[0] ?? {})
      : credential.credentialSubject

    // Format attributes
    const formattedAttributes = formatAttributesWithRecordMetadata(credentialAttributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,
      rawAttributes: credentialAttributes,
      metadata: {
        holder: firstCredential.credentialSubjectIds[0],
        issuer: firstCredential.issuerId,
        type,
        issuedAt: new Date(firstCredential.issuanceDate).toISOString(),
        validUntil: firstCredential.expirationDate ? new Date(firstCredential.expirationDate).toISOString() : undefined,
        validFrom: new Date(firstCredential.issuanceDate).toISOString(),
      },
      claimFormat: firstCredential.claimFormat,
      record: credentialRecord,
      category: credentialCategoryMetadata ?? undefined,
      hasRefreshToken,
    }
  }

  if (credentialRecord instanceof W3cV2CredentialRecord) {
    const resolvedCredential = credentialRecord.firstCredential.resolvedCredential
    const credential = resolvedCredential.toJSON()

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const issuerDisplay = getW3cIssuerDisplay(credential, openId4VcMetadata)
    const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

    // FIXME: support credential with multiple subjects
    const credentialAttributes = Array.isArray(credential.credentialSubject)
      ? (credential.credentialSubject[0] ?? {})
      : credential.credentialSubject

    // Format attributes
    const formattedAttributes = formatAttributesWithRecordMetadata(credentialAttributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,

      rawAttributes: credentialAttributes,
      metadata: {
        holder: resolvedCredential.credentialSubjectIds[0],
        issuer: resolvedCredential.issuerId,
        type: Array.isArray(resolvedCredential.type)
          ? resolvedCredential.type[resolvedCredential.type.length - 1]
          : resolvedCredential.type,
        issuedAt: resolvedCredential.validFrom ? new Date(resolvedCredential.validFrom).toISOString() : undefined,
        validUntil: resolvedCredential.validUntil ? new Date(resolvedCredential.validUntil).toISOString() : undefined,
        validFrom: resolvedCredential.validFrom ? new Date(resolvedCredential.validFrom).toISOString() : undefined,
      },
      claimFormat: credentialRecord.firstCredential.claimFormat,
      record: credentialRecord,
      category: credentialCategoryMetadata ?? undefined,
      hasRefreshToken,
    }
  }

  throw new Error('Unsupported format')
}
