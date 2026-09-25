import { TypedArrayEncoder, X509Certificate, X509Service } from '@credo-ts/core'
import {
  getOpenId4VcCredentialMetadata,
  getPasoCredentialMetadata,
  setPasoCredentialMetadata,
} from '../metadata/credentials'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { type CredentialRecord, updateCredential } from '../storage/credentials'
import { pasoLocalePriorityList } from './locale'
import { computeSriIntegrity } from './sri'
import {
  isPasoTransactionDataType,
  type PasoCredentialMetadata,
  type PasoSignedCredentialMetadataPayload,
} from './types'

/**
 * Signed credential metadata, per [PaSO Proof Metadata].
 *
 * The signed JWT is the *sole* authoritative source for a PaSO Credential's `transaction_data_types`
 * (Section 3), which is why none of this falls back to the unsigned Credential Issuer Metadata.
 *
 * Three rules shape the design and are easy to get wrong:
 *
 * - Section 6: the Wallet persists the JWT **in its signed form** and re-runs the full verification
 *   every time it loads it. So we store compact strings, never the decoded object — the decoded form
 *   would be evidence of nothing in a dispute, and an expired JWT has to start failing on its own.
 * - Section 6 again: a stored JWT that fails verification "SHALL" be discarded *and re-fetched*, and
 *   the Wallet "SHALL NOT proceed with any PaSO operation for that credential until a valid metadata
 *   JWT covering the required locale is obtained". Discarding without re-fetching is what turns a
 *   routine expiry into a card that can never pay again.
 * - Section 6.1 of [PaSO Core]: `metadata_integrity` is the [W3C.SRI] value *of that JWT*, so the
 *   exact bytes we verified are the bytes we hash. Re-serialising a decoded payload would not
 *   reproduce them.
 *
 * Not implemented: the `kid` variant of Section 4, where the issuer publishes its keys through the
 * credential format's issuer-key mechanism instead of `x5c`. Every PaSO deployment we talk to is
 * x5c-based, and the `kid` path needs SD-JWT-VC issuer metadata resolution that Credo does not
 * expose for a bare JWT. Both halves of that variant are rejected rather than partially honoured —
 * see the credential binding in {@link verifyPasoCredentialMetadataJwt}.
 */

export interface VerifiedPasoCredentialMetadata {
  /** The compact JWT, exactly as stored and verified. */
  compact: string
  payload: PasoSignedCredentialMetadataPayload
  credentialMetadata: PasoCredentialMetadata
  /** [PaSO Core] Section 6.1 `metadata_integrity`. */
  integrity: string
}

/**
 * How long before `exp` a stored JWT is renewed.
 *
 * [PaSO Proof Metadata] Section 8 requires renewal "before their `exp` time", and Section 8 also
 * forbids fetching in a pattern a network observer could correlate with a presentation. Those pull
 * in opposite directions at presentation time, so renewal happens on its own schedule and the
 * presentation path only re-fetches when it has nothing usable left.
 */
const renewalWindowSeconds = 6 * 60 * 60

interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: Uint8Array
  signingInput: string
}

function decodeJwt(compact: string): DecodedJwt {
  const parts = compact.split('.')
  if (parts.length !== 3) throw new Error('Credential metadata is not a compact JWT')

  const [encodedHeader, encodedPayload, encodedSignature] = parts

  return {
    header: JSON.parse(TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64Url(encodedHeader))),
    payload: JSON.parse(TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64Url(encodedPayload))),
    signature: TypedArrayEncoder.fromBase64Url(encodedSignature),
    signingInput: `${encodedHeader}.${encodedPayload}`,
  }
}

/** The issuer facts of an SD-JWT VC that the metadata JWT is bound against. */
export interface PasoCredentialBinding {
  issuer: string
  credentialType: string
  x5c?: string[]
}

/**
 * The facts [PaSO Proof Metadata] Section 7 binds a metadata JWT against.
 *
 * The **Credential Issuer Identifier** of step 4 comes from the Credential Issuer Metadata, not from
 * the credential's own `iss` claim. Those are usually the same string, which makes the shortcut
 * tempting — but an [SD-JWT-VC] signed with an `x5c` chain is identified by that chain and is allowed
 * to carry no `iss` at all. Credo omits it whenever an issuer signs with `x5c` and passes no issuer
 * identifier, so reading `iss` here means every such credential looks like it has no issuer.
 *
 * `vct` still comes from the credential, because step 6 compares `sub` against the credential's type
 * identifier "as defined by the credential format".
 */
export function getPasoCredentialBinding(credentialRecord: CredentialRecord): PasoCredentialBinding | undefined {
  if (credentialRecord.type !== 'SdJwtVcRecord') return undefined

  const issuer = getOpenId4VcCredentialMetadata(credentialRecord)?.issuer.id
  if (!issuer) return undefined

  const { header, payload } = decodeJwt(credentialRecord.credentialInstances[0].compactSdJwtVc.split('~')[0])
  const credentialType = payload.vct

  if (typeof credentialType !== 'string') return undefined

  return {
    issuer,
    credentialType,
    x5c: Array.isArray(header.x5c) ? (header.x5c as string[]) : undefined,
  }
}

/**
 * Fetches the signed credential metadata JWT.
 *
 * [PaSO Proof Metadata] Section 2: `Accept: application/jwt` selects the signed form, and
 * `Accept-Language` is a **SHALL** — the Attestation Provider is allowed to answer 400 without it,
 * and it decides which locales the returned JWT covers.
 */
export async function fetchPasoCredentialMetadataJwt(
  credentialMetadataUri: string,
  localePriorityList: string[]
): Promise<string> {
  const acceptLanguage = localePriorityList
    .map((locale, index) => (index === 0 ? locale : `${locale};q=${Math.max(0.1, 1 - index * 0.1).toFixed(1)}`))
    .join(', ')

  const response = await fetch(credentialMetadataUri, {
    headers: {
      Accept: 'application/jwt',
      'Accept-Language': acceptLanguage,
    },
  })

  if (!response.ok) {
    throw new Error(
      `Could not fetch PaSO credential metadata from '${credentialMetadataUri}'. Received status ${response.status}`
    )
  }

  return (await response.text()).trim()
}

/**
 * Whether a fetched metadata JWT declares any PaSO transaction data type.
 *
 * This reads the payload **without verifying it**, and is used for exactly one decision: whether the
 * credential being issued is a PaSO Credential at all. PaSO removed TS 12's credential-level
 * identification rule, so at issuance time there is nothing else to go on.
 *
 * Nothing it returns is trusted. A `true` answer only means the next step is the full verification
 * procedure, whose failure rejects the issuance ([PaSO Proof Metadata] Section 3). A tampered JWT can
 * therefore cause a rejection, never an acceptance.
 */
export function declaresPasoTransactionDataTypes(compact: string): boolean {
  try {
    const { payload } = decodeJwt(compact)
    const credentialMetadata = payload.credential_metadata as PasoCredentialMetadata | undefined
    return Object.keys(credentialMetadata?.transaction_data_types ?? {}).some((type) => isPasoTransactionDataType(type))
  } catch {
    return false
  }
}

/**
 * The `exp` of a stored JWT, read without verifying it.
 *
 * Only ever used to decide *whether to re-fetch*, never whether to trust. An unreadable or absent
 * `exp` reads as "expired", which schedules a renewal — the verification that follows is what
 * decides anything.
 */
function getUnverifiedExpiry(compact: string): number {
  try {
    const { payload } = decodeJwt(compact)
    return typeof payload.exp === 'number' ? payload.exp : 0
  } catch {
    return 0
  }
}

/**
 * The full verification procedure of [PaSO Proof Metadata] Section 7.
 *
 * Runs on every load, not only on fetch — Section 6 requires it, and it is what makes an expired or
 * tampered stored JWT fail closed instead of quietly rendering a consent screen.
 *
 * `retrievedFrom` implements Section 8: after redirects, the `credential_metadata_uri` claim must
 * match the URI the JWT actually came from. Omit it when re-verifying from storage, where there was
 * no retrieval to compare against.
 */
export async function verifyPasoCredentialMetadataJwt(
  sdk: ParadymWalletSdk,
  options: {
    compact: string
    binding: PasoCredentialBinding
    retrievedFrom?: string
  }
): Promise<VerifiedPasoCredentialMetadata> {
  const { compact, binding, retrievedFrom } = options
  const { header, payload, signature, signingInput } = decodeJwt(compact)

  // 1. `typ`
  if (header.typ !== 'credential-metadata+jwt') {
    throw new Error(`PaSO credential metadata JWT has unexpected 'typ' header '${String(header.typ)}'`)
  }

  const x5c = Array.isArray(header.x5c) ? (header.x5c as string[]) : undefined
  if (!x5c || x5c.length === 0) {
    throw new Error(
      "PaSO credential metadata JWT does not contain an 'x5c' header. The 'kid' based issuer key set variant of [PaSO Proof Metadata] Section 4 is not supported by this wallet"
    )
  }

  // 2. Signature, using the key of the x5c leaf certificate.
  const leafCertificate = X509Certificate.fromEncodedCertificate(x5c[0])
  const verifyResult = await sdk.agent.kms.verify({
    signature,
    key: { publicJwk: leafCertificate.publicJwk.toJson() },
    data: TypedArrayEncoder.fromUtf8String(signingInput),
    algorithm: leafCertificate.publicJwk.signatureAlgorithm,
  })
  if (!verifyResult.verified) throw new Error('PaSO credential metadata JWT signature verification failed')

  // 3. Signing key trust: the chain must terminate in the wallet's trust store.
  //
  // The trust store is read first and its absence is fatal. `validateCertificateChain` treats an
  // omitted `trustedCertificates` as "verify the chain's internal structure only" and performs no
  // trust check at all, which would accept any self-signed chain — and Credo hands back `undefined`
  // rather than an empty array when a wallet has no trusted certificates configured, so the
  // fail-open case is one configuration mistake away rather than hypothetical.
  const trustedCertificates = sdk.agent.x509.config.trustedCertificates
  if (!trustedCertificates || trustedCertificates.length === 0) {
    throw new Error('This wallet has no trusted certificates, so PaSO credential metadata cannot be trusted')
  }
  await X509Service.validateCertificateChain(sdk.agent.context, { certificateChain: x5c, trustedCertificates })

  // 4. `iss` matches the Credential Issuer Identifier.
  if (payload.iss !== binding.issuer) {
    throw new Error(
      `PaSO credential metadata JWT 'iss' '${String(payload.iss)}' does not match the credential issuer '${binding.issuer}'`
    )
  }

  // 5. `exp` has not passed.
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    throw new Error('PaSO credential metadata JWT has expired')
  }

  // 6. Credential binding.
  if (payload.sub !== binding.credentialType) {
    throw new Error(
      `PaSO credential metadata JWT 'sub' '${String(payload.sub)}' does not match the credential type '${binding.credentialType}'`
    )
  }

  // Section 7 step 6 has two branches, and the non-x5c one requires the JWT to verify "using a key
  // from the same issuer key set that verifies the credential itself" — the key set resolution this
  // wallet does not implement. Without it the only thing left binding the metadata to this issuer
  // would be the `iss` string inside the JWT, which the JWT's own signer chose. Section 5.5 is blunt
  // about what that is worth: "The guarantee rests on the credential binding (step 6), not on the
  // signature alone." So a credential with no chain of its own is refused rather than half-bound.
  if (!binding.x5c || binding.x5c.length === 0) {
    throw new Error(
      'This PaSO Credential carries no x5c certificate chain, and the issuer key set variant of [PaSO Proof Metadata] Section 7 step 6 is not supported by this wallet'
    )
  }

  const metadataRoot = X509Certificate.fromEncodedCertificate(x5c[x5c.length - 1])
  const credentialRoot = X509Certificate.fromEncodedCertificate(binding.x5c[binding.x5c.length - 1])
  if (metadataRoot.subject !== credentialRoot.subject || metadataRoot.issuer !== credentialRoot.issuer) {
    throw new Error("PaSO credential metadata JWT 'x5c' chain does not share a root CA with the credential")
  }

  const credentialLeaf = X509Certificate.fromEncodedCertificate(binding.x5c[0])
  if (leafCertificate.subject !== credentialLeaf.subject) {
    throw new Error("PaSO credential metadata JWT 'x5c' leaf subject does not match the credential's leaf subject")
  }

  // 7. Renewal: the URI in the JWT is the URI it was served from, after redirects.
  if (typeof payload.credential_metadata_uri !== 'string') {
    throw new Error("PaSO credential metadata JWT is missing 'credential_metadata_uri'")
  }
  if (retrievedFrom !== undefined && payload.credential_metadata_uri !== retrievedFrom) {
    throw new Error(
      `PaSO credential metadata JWT 'credential_metadata_uri' does not match the URI it was retrieved from '${retrievedFrom}'`
    )
  }

  const credentialMetadata = payload.credential_metadata as PasoCredentialMetadata | undefined
  if (!credentialMetadata || typeof credentialMetadata.transaction_data_types !== 'object') {
    throw new Error("PaSO credential metadata JWT is missing 'credential_metadata.transaction_data_types'")
  }

  return {
    compact,
    payload: payload as unknown as PasoSignedCredentialMetadataPayload,
    credentialMetadata,
    integrity: computeSriIntegrity(compact),
  }
}

/**
 * Fetches, verifies and stores the signed credential metadata of a credential being issued.
 *
 * Returns whether the credential is a PaSO Credential. A credential that is not — a TS 12 one, or an
 * issuer that serves a `credential_metadata_uri` for something else entirely — is left alone for the
 * caller to handle.
 *
 * Exactly one thing decides which it is: whether the document served at the URI is a JWT declaring
 * `urn:paso:sca:` transaction data types. Everything after that point is a PaSO problem and throws,
 * because [PaSO Proof Metadata] Section 3 says that once the Wallet has determined a credential *is*
 * a PaSO Credential but holds no validly signed metadata JWT for it, it "SHALL reject the issuance
 * and inform the user".
 *
 * That ordering is load-bearing. Answering "not PaSO" to a question we could not answer hands a PaSO
 * metadata JWT to the TS 12 resolver, whose schema expects Credential Issuer Metadata under
 * `credential_metadata` — so the user sees a validation error about `credential_endpoint` rather than
 * anything to do with the actual failure.
 */
export async function storePasoCredentialMetadata(
  paradym: ParadymWalletSdk,
  credentialRecord: CredentialRecord,
  credentialMetadataUri: string
): Promise<boolean> {
  let compact: string
  try {
    compact = await fetchPasoCredentialMetadataJwt(credentialMetadataUri, pasoLocalePriorityList())
  } catch (error) {
    paradym.logger.debug('Could not retrieve signed PaSO credential metadata, treating credential as non-PaSO', {
      error,
    })
    return false
  }

  if (!declaresPasoTransactionDataTypes(compact)) return false

  const binding = getPasoCredentialBinding(credentialRecord)
  if (!binding) {
    throw new Error(
      'Received a PaSO Credential, but its Credential Issuer Identifier and credential type could not be determined'
    )
  }

  const verified = await verifyPasoCredentialMetadataJwt(paradym, {
    compact,
    binding,
    retrievedFrom: credentialMetadataUri,
  })

  setPasoCredentialMetadata(credentialRecord, {
    signedMetadataJwts: [compact],
    credentialMetadataUri: verified.payload.credential_metadata_uri,
  })

  return true
}

/**
 * Re-fetches the signed credential metadata of a credential and persists it.
 *
 * The fetched JWT replaces the stored ones rather than joining them: the Attestation Provider serves
 * the locales we ask for (Section 2), so a fresh answer to the current locale priority list
 * supersedes whatever an older list produced.
 */
async function refetchAndStore(
  paradym: ParadymWalletSdk,
  credentialRecord: CredentialRecord,
  credentialMetadataUri: string,
  binding: PasoCredentialBinding
): Promise<VerifiedPasoCredentialMetadata> {
  const compact = await fetchPasoCredentialMetadataJwt(credentialMetadataUri, pasoLocalePriorityList())
  const verified = await verifyPasoCredentialMetadataJwt(paradym, {
    compact,
    binding,
    retrievedFrom: credentialMetadataUri,
  })

  setPasoCredentialMetadata(credentialRecord, {
    signedMetadataJwts: [compact],
    credentialMetadataUri: verified.payload.credential_metadata_uri,
  })
  await updateCredential({ paradym, credentialRecord })

  return verified
}

/**
 * The credential's verified metadata, re-fetching it when what we hold is no longer usable.
 *
 * [PaSO Proof Metadata] Section 6: "If a stored metadata JWT fails verification upon loading (e.g.,
 * due to expiry or corruption), the Wallet SHALL discard it and re-fetch and verify it per Section
 * 7." A wallet that only discards leaves the user with a card that refuses every payment from the
 * moment the JWT expires, with nothing they can do about it.
 *
 * Several JWTs may be stored because a provider serves a limited set of locales per JWT (Section 2),
 * so `requiredType` not being covered by any of them is also grounds to go and ask again.
 */
export async function loadVerifiedPasoCredentialMetadata(
  paradym: ParadymWalletSdk,
  options: {
    credentialRecord: CredentialRecord
    requiredType?: string
  }
): Promise<VerifiedPasoCredentialMetadata | undefined> {
  const { credentialRecord, requiredType } = options

  const stored = getPasoCredentialMetadata(credentialRecord)
  if (!stored) return undefined

  const binding = getPasoCredentialBinding(credentialRecord)
  if (!binding) return undefined

  const covers = (metadata: VerifiedPasoCredentialMetadata) =>
    !requiredType || requiredType in metadata.credentialMetadata.transaction_data_types

  for (const compact of stored.signedMetadataJwts) {
    try {
      const verified = await verifyPasoCredentialMetadataJwt(paradym, { compact, binding })
      if (covers(verified)) return verified
    } catch (error) {
      paradym.logger.warn('Discarding a stored PaSO credential metadata JWT that failed verification', { error })
    }
  }

  try {
    const verified = await refetchAndStore(paradym, credentialRecord, stored.credentialMetadataUri, binding)
    return covers(verified) ? verified : undefined
  } catch (error) {
    paradym.logger.error('Could not re-fetch the PaSO credential metadata of a credential', { error })
    return undefined
  }
}

/**
 * Renews the signed credential metadata of every PaSO Credential that is due, per Section 8.
 *
 * Deliberately not part of the presentation flow. Section 8 requires renewal before `exp` and, in
 * the same breath, that "credential metadata retrieval SHALL NOT be linkable to credential usage" —
 * the Wallet "SHALL NOT fetch credential metadata immediately before or after a presentation in a
 * pattern that would allow a network observer to correlate the two activities". Renewing on the
 * wallet's own schedule satisfies both; renewing at consent time would satisfy the first by breaking
 * the second.
 */
export async function renewPasoCredentialMetadata(
  paradym: ParadymWalletSdk,
  credentialRecords: CredentialRecord[]
): Promise<void> {
  const dueAt = Date.now() / 1000 + renewalWindowSeconds

  for (const credentialRecord of credentialRecords) {
    const stored = getPasoCredentialMetadata(credentialRecord)
    if (!stored) continue

    const isDue = stored.signedMetadataJwts.every((compact) => getUnverifiedExpiry(compact) <= dueAt)
    if (!isDue) continue

    const binding = getPasoCredentialBinding(credentialRecord)
    if (!binding) continue

    try {
      await refetchAndStore(paradym, credentialRecord, stored.credentialMetadataUri, binding)
      paradym.logger.debug('Renewed the signed PaSO credential metadata of a credential')
    } catch (error) {
      paradym.logger.warn('Could not renew the signed PaSO credential metadata of a credential', { error })
    }
  }
}
