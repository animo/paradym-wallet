import type { OpenId4VcCredentialMetadata } from '../metadata/credentials'
import { getHostNameFromUrl } from '../utils/url'
import { findDisplay } from './common'
import type { CredentialDisplay, CredentialIssuerDisplay } from './credential'

export function getOpenId4VcIssuerDisplay(metadata?: OpenId4VcCredentialMetadata): CredentialIssuerDisplay {
  const issuerDisplay: Partial<CredentialIssuerDisplay> = {}

  // Try to extract from openid metadata first
  if (metadata) {
    const openidIssuerDisplay = findDisplay(metadata.issuer.display)

    if (openidIssuerDisplay) {
      issuerDisplay.name = openidIssuerDisplay.name

      if (openidIssuerDisplay.logo) {
        issuerDisplay.logo = {
          url: openidIssuerDisplay.logo?.uri,
          altText: openidIssuerDisplay.logo?.alt_text,
        }
      }
    }

    // If the credentialDisplay contains a logo, and the issuerDisplay does not, use the logo from the credentialDisplay
    const openidCredentialDisplay = findDisplay(metadata.credential.display)
    if (openidCredentialDisplay && !issuerDisplay.logo && openidCredentialDisplay.logo) {
      issuerDisplay.logo = {
        url: openidCredentialDisplay.logo?.uri,
        altText: openidCredentialDisplay.logo?.alt_text,
      }
    }
  }

  // Last fallback: use issuer id from openid4vc
  if (!issuerDisplay.name && metadata?.issuer.id) {
    issuerDisplay.name = getHostNameFromUrl(metadata.issuer.id)
  }

  if (metadata?.issuer.id) {
    issuerDisplay.domain = getHostNameFromUrl(metadata.issuer.id)
  }

  return {
    ...issuerDisplay,
    name: issuerDisplay.name ?? 'Unknown',
  }
}

export function getOpenId4VcCredentialDisplay(metadata: OpenId4VcCredentialMetadata) {
  const openidCredentialDisplay = findDisplay(metadata.credential.display)

  const credentialDisplay: Omit<CredentialDisplay, 'name'> & { name?: string } = {
    name: openidCredentialDisplay?.name,
    description: openidCredentialDisplay?.description,
    textColor: openidCredentialDisplay?.text_color,
    backgroundColor: openidCredentialDisplay?.background_color,
    backgroundImage: openidCredentialDisplay?.background_image
      ? {
          url: openidCredentialDisplay.background_image.uri,
        }
      : undefined,
    issuer: getOpenId4VcIssuerDisplay(metadata),
  }

  // NOTE: logo is used in issuer display (not sure if that's right though)

  return credentialDisplay
}
