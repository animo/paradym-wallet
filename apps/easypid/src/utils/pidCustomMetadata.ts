// EU Digital Identity Wallet - Person Identification Data (PID) Attributes
// Based on ARF Annex 3.01 - PID Rulebook v1.4 (20 Nov 2025)
// References: CIR 2024/2977

export type PidAttributes = PidMdocAttributes | PidSdJwtVcAttributes

// =============================================================================
// ISO/IEC 18013-5 compliant encoding (mDoc format)
// Specification: ARF Annex 3.01 Chapter 3
// =============================================================================

interface PlaceOfBirth {
  country?: string // Alpha-2 country code as specified in ISO 3166-1
  region?: string // State, province, district, or local area
  locality?: string // Municipality, city, town, or village
}

export type PidMdocAttributes = {
  // ============================================
  // Mandatory attributes (CIR 2024/2977 Table 1)
  // ============================================

  family_name: string // Current last name(s) or surname(s) - tstr, max 150 chars
  given_name: string // Current first name(s), including middle name(s) - tstr, max 150 chars
  birth_date: string // Date of birth - full-date (CBOR tag 1004)
  place_of_birth: PlaceOfBirth // Birth location - at least one property required
  nationality: string[] // Array of alpha-2 country codes (ISO 3166-1) - nationalities type

  // ============================================
  // Mandatory metadata (CIR 2024/2977 Table 5)
  // ============================================

  expiry_date: string // Administrative expiry date - tdate or full-date
  issuing_authority: string // Issuing authority name or ISO 3166 alpha-2 code - tstr, max 150 chars
  issuing_country: string // Alpha-2 country code (ISO 3166-1) - tstr, max 150 chars

  // ============================================
  // Optional attributes (CIR 2024/2977 Table 2)
  // ============================================

  resident_address?: string // Full address of residence - tstr, max 150 chars
  resident_country?: string // Country of residence (alpha-2 code) - tstr, max 150 chars
  resident_state?: string // State/province/district of residence - tstr, max 150 chars
  resident_city?: string // Municipality/city/town/village of residence - tstr, max 150 chars
  resident_postal_code?: string // Postal code of residence - tstr, max 150 chars
  resident_street?: string // Street name of residence - tstr, max 150 chars
  resident_house_number?: string // House number including affix/suffix - tstr, max 150 chars
  personal_administrative_number?: string // Unique administrative number - tstr, max 150 chars
  portrait?: string // Facial image (ISO 19794-5 or ISO 39794) - bstr (base64 encoded)
  family_name_birth?: string // Last name(s) at birth - tstr, max 150 chars
  given_name_birth?: string // First name(s) at birth - tstr, max 150 chars
  sex?: number // Sex classification - uint (0=not known, 1=male, 2=female, 3=other, 4=inter, 5=diverse, 6=open, 9=not applicable)
  email_address?: string // Email address (RFC 5322) - tstr, max 150 chars
  mobile_phone_number?: string // Mobile phone with + and country code - tstr, max 150 chars

  // ============================================
  // Optional metadata (CIR 2024/2977)
  // ============================================

  document_number?: string // Document number - tstr, max 150 chars
  issuing_jurisdiction?: string // Country subdivision code (ISO 3166-2:2020) - tstr, max 150 chars
  // Note: location_status is absent in mDoc format - revocation info in MSO per ISO/IEC 18013-5

  // ============================================
  // Additional optional attributes (PID Rulebook Section 2.6)
  // ============================================

  issuance_date?: string // Date when PID was issued - tdate or full-date
  trust_anchor?: string // URL for trust anchor lookup - tstr, max 150 chars
  attestation_legal_category?: string // Attestation category (e.g., "PID") - tstr, max 150 chars
}

// =============================================================================
// SD-JWT VC-based encoding
// Specification: ARF Annex 3.01 Chapter 4
// =============================================================================

interface Address {
  formatted?: string // Complete formatted address (OIDC 5.1)
  street_address?: string // Street name (OIDC 5.1)
  house_number?: string // House number including affix/suffix (OIDC 5.1)
  locality?: string // Municipality/city/town/village (OIDC 5.1)
  region?: string // State/province/district (OIDC 5.1)
  postal_code?: string // Postal code (OIDC 5.1)
  country?: string // Alpha-2 country code (OIDC 5.1)
}

export interface ArfPidSdJwtVcAttributes {
  // ============================================
  // VCT (Verifiable Credential Type)
  // ============================================

  vct: string // Type identifier - base type "urn:eudi:pid:1" or domestic type in "urn:eudi:pid:" namespace

  // ============================================
  // Mandatory attributes (CIR 2024/2977 Table 1)
  // Using IANA registered claim names from OIDC 5.1 and EKYC 4.1
  // ============================================

  family_name: string // Current last name(s) or surname(s) - OIDC 5.1
  given_name: string // Current first name(s), including middle name(s) - OIDC 5.1
  birthdate: string // Date of birth in ISO 8601-1 YYYY-MM-DD format - OIDC 5.1
  place_of_birth: PlaceOfBirth // Birth location (at least one property required) - EKYC 4.1
  nationalities: string[] // Array of alpha-2 country codes - EKYC 4.1

  // ============================================
  // Mandatory metadata (CIR 2024/2977 Table 5)
  // Using Private Names specific to attestation type
  // ============================================

  date_of_expiry: string // Administrative expiry date in ISO 8601-1 YYYY-MM-DD format
  issuing_authority: string // Name of issuing authority or alpha-2 country code
  issuing_country: string // Alpha-2 country code of issuing country

  // ============================================
  // Optional attributes (CIR 2024/2977 Table 2)
  // ============================================

  address?: Address // Address where user resides (OIDC 5.1 with hierarchical structure)
  personal_administrative_number?: string // Unique administrative number
  picture?: string // Data URL with base64-encoded JPEG portrait (OIDC 5.1)
  birth_family_name?: string // Last name(s) at birth - EKYC 4.1
  birth_given_name?: string // First name(s) at birth - EKYC 4.1
  sex?: number // Sex classification (0-9, not using OIDC gender due to different value range)
  email?: string // Email address (RFC 5322) - OIDC 5.1
  phone_number?: string // Mobile phone with + and country code - OIDC 5.1

  // ============================================
  // Optional metadata (CIR 2024/2977)
  // ============================================

  document_number?: string // Document number
  issuing_jurisdiction?: string // Country subdivision code (ISO 3166-2:2020)
  // Note: location_status uses 'status' claim per SD-JWT VC 3.2.2.2 and HAIP 6.1

  // ============================================
  // Additional optional attributes (PID Rulebook Section 2.6)
  // ============================================

  date_of_issuance?: string // Date when PID was issued in ISO 8601-1 YYYY-MM-DD format
  trust_anchor?: string // URL for machine-readable trust anchor
  attestation_legal_category?: string // Attestation category indicator (e.g., "PID")

  // ============================================
  // Standard JWT claims for technical validity
  // ============================================

  iss?: string // Issuer identifier
  iat?: number // Issued at timestamp
  exp?: number // Expiration timestamp (technical validity)
  nbf?: number // Not before timestamp (technical validity)

  // ============================================
  // Key binding (SD-JWT VC)
  // ============================================

  cnf?: {
    jwk?: Record<string, unknown> // Public key in JWK format for key binding
  }
}

// Simplified type for actual usage (matching your existing code structure)
export type PidSdJwtVcAttributes = {
  issuing_country: string
  issuing_authority: string
  given_name: string
  family_name: string
  birth_family_name?: string
  place_of_birth: {
    locality?: string
    region?: string
    country?: string
  }
  address?: {
    locality?: string
    street_address?: string
    country?: string
    postal_code?: string
    house_number?: string
    region?: string
    formatted?: string
  }
  birthdate: string
  nationalities: string[]
  iss?: string
  date_of_expiry?: string
  date_of_issuance?: string
  vct?: string
  personal_administrative_number?: string
  picture?: string
  birth_given_name?: string
  sex?: number
  email?: string
  phone_number?: string
  document_number?: string
  issuing_jurisdiction?: string
  trust_anchor?: string
  attestation_legal_category?: string
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Formats place of birth for display
 * @param place PlaceOfBirth object
 * @returns Formatted string or null if empty
 */
export function formatArfPidPlaceOfBirth(place: PlaceOfBirth): string | null {
  const { country, region, locality } = place

  // If nothing is provided, return null
  if (!country && !region && !locality) {
    return null
  }

  // Build the string from most specific to least specific
  const parts: string[] = []

  // Add locality if available
  if (locality) {
    parts.push(locality)
  }

  // Add region if available and different from locality
  if (region && region !== locality) {
    parts.push(region)
  }

  // Handle country code
  if (country) {
    if (parts.length > 0) {
      // Add country in parentheses if we have other location info
      return `${parts.join(', ')} (${country})`
    }

    // Just return country code if that's all we have
    return country
  }

  // If no country but we have region/locality
  return parts.join(', ')
}
