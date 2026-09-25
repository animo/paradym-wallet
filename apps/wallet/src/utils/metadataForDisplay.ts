import { t } from '@lingui/core/macro'
import { commonMessages } from '@package/translations'
import { formatDate } from '@package/utils'
import type { CredentialMetadata, FormattedAttribute } from '@paradym/wallet-sdk'

/**
 * The wallet's own metadata rows for a credential — who issued it, when it expires — as labelled
 * attributes.
 *
 * Lives here rather than in the SDK because these labels name nothing the credential contains:
 * they name a section this app chose to render. The SDK hands over `metadata` as data and the
 * wording is ours, which also keeps its published bundle free of the wallet's translations.
 */
export function metadataForDisplay(metadata: CredentialMetadata): FormattedAttribute[] {
  const { type, holder, issuedAt, issuer, validFrom, validUntil } = metadata

  const attributes: FormattedAttribute[] = []

  if (type) {
    attributes.push({
      type: 'string',
      label: t(commonMessages.fields.credentialType),
      rawValue: type,
      path: ['type'],
      value: type,
    })
  }

  if (issuer) {
    attributes.push({
      type: 'string',
      label: t(commonMessages.fields.issuer),
      rawValue: issuer,
      path: ['issuer'],
      value: issuer,
    })
  }

  if (holder) {
    attributes.push({
      type: 'string',
      label: t(commonMessages.fields.holder),
      rawValue: holder,
      path: ['holder'],
      value: holder,
    })
  }

  if (issuedAt) {
    attributes.push({
      type: 'date',
      label: t(commonMessages.fields.issued_at),
      rawValue: issuedAt,
      path: ['issuedAt'],
      value: formatDate(new Date(issuedAt)),
    })
  }

  if (validFrom) {
    attributes.push({
      type: 'date',
      label: t(commonMessages.fields.validFrom),
      rawValue: validFrom,
      path: ['validFrom'],
      value: formatDate(new Date(validFrom)),
    })
  }

  if (validUntil) {
    attributes.push({
      type: 'date',
      label: t(commonMessages.fields.expires_at),
      rawValue: validUntil,
      path: ['validUntil'],
      value: formatDate(new Date(validUntil)),
    })
  }

  return attributes
}
