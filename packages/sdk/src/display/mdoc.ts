import { ClaimFormat, type Mdoc, type MdocNameSpaces, type MdocRecord } from '@credo-ts/core'
import {
  type CredentialCategoryMetadata,
  getOpenId4VcCredentialMetadata,
  type OpenId4VcCredentialMetadata,
} from '../metadata/credentials'
import { safeCalculateJwkThumbprint } from '../utils/jwkThumbprint'
import type { CredentialDisplay, CredentialForDisplay, CredentialForDisplayId, CredentialMetadata } from './credential'
import { getAttributesForDocTypeOrVct } from './docTypeOfVct'
import { recursivelyMapMdocAttributes } from './mapAttributes'
import { getOpenId4VcCredentialDisplay, getOpenId4VcIssuerDisplay } from './openid4vc'

export function getDisplayInformationForMdocCredential(
  credentialRecord: MdocRecord,
  credentialForDisplayId: CredentialForDisplayId,
  hasRefreshToken: boolean,
  credentialCategoryMetadata?: CredentialCategoryMetadata
): CredentialForDisplay {
  const mdocInstance = credentialRecord.firstCredential

  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
  const credentialDisplay = getMdocCredentialDisplay(mdocInstance, openId4VcMetadata)
  const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)
  const { attributes, metadata } = getAttributesAndMetadataForMdocPayload(
    mdocInstance.issuerSignedNamespaces,
    mdocInstance
  )
  const customAttributesForDisplay =
    getAttributesForDocTypeOrVct({
      type: mdocInstance.docType,
      attributes,
    }) ?? attributes

  return {
    id: credentialForDisplayId,
    createdAt: credentialRecord.createdAt,
    display: {
      ...credentialDisplay,
      issuer: issuerDisplay,
    },
    attributes: customAttributesForDisplay,
    rawAttributes: attributes,
    metadata,
    claimFormat: ClaimFormat.MsoMdoc,
    record: credentialRecord,
    category: credentialCategoryMetadata ?? undefined,
    hasRefreshToken,
  }
}

function getMdocCredentialDisplay(mdoc: Mdoc, openId4VcMetadata: OpenId4VcCredentialMetadata | null) {
  let credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    credentialDisplay = getOpenId4VcCredentialDisplay(openId4VcMetadata)
  }

  return {
    ...credentialDisplay,
    // If there's no name for the credential, we extract it from the doctype
    name: credentialDisplay.name ?? mdoc.docType,
  }
}

export function getAttributesAndMetadataForMdocPayload(namespaces: MdocNameSpaces, mdocInstance: Mdoc) {
  const attributes: CredentialForDisplay['attributes'] = Object.fromEntries(
    Object.values(namespaces).flatMap((v) => {
      return Object.entries(v).map(([key, value]) => [key, recursivelyMapMdocAttributes(value)])
    })
  )

  // FIXME: Date should be fixed in Mdoc library
  // The problem is that mdocInstance.validityInfo.validFrom and validUntil are already Date objects that contain NaN, not just NaN values.
  // When you call toISOString() on a Date containing NaN, it will throw an error.
  const mdocMetadata: CredentialMetadata = {
    type: mdocInstance.docType,
    holder: mdocInstance.deviceKey ? safeCalculateJwkThumbprint(mdocInstance.deviceKey.toJson()) : undefined,
    issuedAt: mdocInstance.validityInfo.signed.toISOString(),
    validFrom:
      mdocInstance.validityInfo.validFrom instanceof Date &&
      !Number.isNaN(mdocInstance.validityInfo.validFrom.getTime())
        ? mdocInstance.validityInfo.validFrom.toISOString()
        : undefined,
    validUntil:
      mdocInstance.validityInfo.validUntil instanceof Date &&
      !Number.isNaN(mdocInstance.validityInfo.validUntil.getTime())
        ? mdocInstance.validityInfo.validUntil.toISOString()
        : undefined,
  }

  return {
    attributes,
    metadata: mdocMetadata,
  }
}
