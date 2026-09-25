import { Hasher, TypedArrayEncoder } from '@credo-ts/core'
import type { FormattedSubmissionEntrySatisfied } from '../format/submission'
import { getPasoCredentialMetadata } from '../metadata/credentials'
import type { CredentialsForProofRequest } from '../openid4vc/func/resolveCredentialRequest'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { loadVerifiedPasoCredentialMetadata } from './credentialMetadata'
import { ParadymWalletPasoError } from './error'
import { resolvePasoImageUrl, validatePasoDataUrlImage } from './image'
import { findPasoMetadataConstraintIssue } from './labelConstraints'
import { resolveLocalisedEntry, selectPasoLocale } from './locale'
import {
  getPasoRulebook,
  type PasoPaymentPayload,
  pasoPaymentTransactionDataType,
  validatePasoPayloadConformance,
} from './paymentRulebook'
import { resolveEffectiveRiskSignalSet } from './riskSignals'
import {
  isPasoTransactionDataType,
  type PasoClaimMetadata,
  type PasoResolvedRiskSignal,
  type PasoTransactionDataTypeMetadata,
} from './types'

/**
 * Transaction data processing for the **simple profile**, per [PaSO Core] Section 7.3.
 *
 * Section 7.3 makes the simple profile mandatory for every PaSO Wallet and the advanced profile
 * (7.4) optional. This wallet implements only the simple profile and renders the Payment rulebook
 * with a dedicated UI, which [PaSO View] Section 1.1 permits — and which is precisely what keeps the
 * advanced profile optional for us, since it is *implementing PaSO View* that would oblige us to
 * support it.
 *
 * The other side of that choice is Section 7.4's obligation: a Wallet that does not support the
 * advanced profile **SHALL reject** a request with more than one PaSO-targeted entry, or with
 * non-trivial PaSO credential sets, and inform the user. Failing softly there — picking the first
 * entry and carrying on — would show the user a consent screen for a transaction the Relying Party
 * did not ask them to authorize. So every such case throws.
 */

const supportedTransactionDataHashAlgorithm = 'sha-256'

/**
 * The hash algorithms Credo will consider, in its own order of preference.
 *
 * Credo picks the first of these that the entry's `transaction_data_hashes_alg` allows and uses it
 * for the [OID4VP] `transaction_data_hashes` claim. We mirror the selection so the algorithm we
 * report in `transaction_data_hash_alg` is the one that actually got used: testing only for
 * membership of `sha-256` would let a request advertising `['sha-1', 'sha-256']` produce a KB-JWT
 * whose two hashes were computed with different algorithms.
 */
const credoTransactionDataHashAlgorithms = ['sha-1', 'sha-256']

/**
 * [PaSO Proof Metadata] Section 3.2 — the UI element identifiers this specification defines.
 *
 * "The Wallet SHALL ignore any unrecognised UI element identifiers", which is why the list is used
 * for locale selection too: requiring a locale to cover a label we ignore would fail locales that
 * cover everything the user actually sees.
 */
const pasoUiLabelKeys = ['transaction_title', 'affirmative_action_label', 'denial_action_label', 'security_hint']

export interface PasoDisplayedClaim {
  /**
   * The issuer's label for the claim, where there is one.
   *
   * Absent only when no card can authorize the transaction, which is the one case where there is no
   * signed metadata to take a label from. The wallet supplies its own translated label then.
   */
  label?: string
  value: string
}

/**
 * A `urn:paso:sca:global:payment:1` entry, resolved and ready to show.
 *
 * Everything the consent screen needs, plus what {@link ./responseClaims.ts} needs afterwards to
 * build the holder binding proof — resolved once, because both the metadata verification and the
 * logo retrieval have side effects we do not want to repeat between consent and signing.
 */
export interface FormattedTransactionDataPasoPayment {
  type: typeof pasoPaymentTransactionDataType
  /** The credential query id whose credential authorizes the transaction. */
  cardForTransactionId: string

  transactionTitle?: string
  affirmativeActionLabel?: string
  denialActionLabel?: string
  /** [PaSO Proof Metadata] Section 3.2 — shown exactly as provided, never replaced. */
  securityHint?: string

  amount: PasoDisplayedClaim
  payee: PasoDisplayedClaim
  /** A `data:` URL of the SRI-verified logo bytes, never the original URL. */
  payeeLogo?: { label?: string; dataUrl: string }

  /**
   * Everything the proof needs, kept out of the way of the UI.
   *
   * Absent when no credential in the wallet can authorize the transaction. The user is still shown
   * what they were asked to pay — the amount and payee come from the request, not from the card —
   * but there is no signed metadata behind it and nothing can be signed, so every value that only
   * exists to go into the holder binding proof is missing rather than invented.
   */
  proof?: {
    encodedEntry: string
    transactionDataHash: string
    transactionDataHashAlgorithm: string
    /** [PaSO Core] Section 6.1 `display_locale`. */
    displayLocale: string
    metadataIntegrity: string
    effectiveRiskSignalSet: PasoResolvedRiskSignal[]
  }

  /** base64url SHA-256 over the *decoded* entry — see {@link hashDecodedEntry}. */
  hash: string
}

type DcqlQuery = {
  credentials?: Array<{ id: string }>
  credential_sets?: Array<{ options: string[][] }>
}

/**
 * Whether the request carries PaSO transaction data at all.
 *
 * [PaSO Core] Section 5.2: entries are identified by the `urn:paso:sca:` prefix on `type`, and
 * nothing else. There is no credential-level identification rule in PaSO — that was a TS 12 concept.
 */
export function hasPasoTransactionData(resolvedRequest: CredentialsForProofRequest): boolean {
  return (
    resolvedRequest.transactionData?.some((entry) => isPasoTransactionDataType(entry.entry.transactionData.type)) ??
    false
  )
}

/**
 * Resolves the single PaSO-targeted entry of a simple-profile request.
 *
 * Throws {@link ParadymWalletPasoError} with a user-facing reason for every case the spec says to
 * cease processing and inform the user.
 */
export async function resolvePasoTransactionData(
  paradym: ParadymWalletSdk,
  resolvedRequest: CredentialsForProofRequest,
  localePriorityList: string[]
): Promise<FormattedTransactionDataPasoPayment> {
  // [PaSO Core] Section 3: "The Wallet SHALL reject unsigned PaSO presentation requests." TS 12 only
  // asked for a warning here; PaSO does not, because `request_integrity` has nothing to bind to.
  if (!resolvedRequest.signedAuthorizationRequest) {
    throw new ParadymWalletPasoError(
      'requestNotSigned',
      'This payment request is not signed, so it cannot be authorized.'
    )
  }

  const allEntries = resolvedRequest.transactionData ?? []
  const pasoEntries = allEntries.filter((entry) => isPasoTransactionDataType(entry.entry.transactionData.type))

  // [PaSO Core] Section 7.4 — the non-advanced Wallet's rejection rule.
  if (pasoEntries.length > 1) {
    throw new ParadymWalletPasoError(
      'multipleTransactions',
      'This payment request contains multiple transactions, which this wallet cannot authorize.'
    )
  }

  const [pasoEntry] = pasoEntries
  if (!pasoEntry) {
    throw new ParadymWalletPasoError(
      'unsupportedTransactionType',
      'This payment request does not contain a payment this wallet recognises.'
    )
  }

  // A PaSO entry alongside other transaction data would have the wallet sign one and drop the rest:
  // the accept path selects a credential per entry, and an entry left unselected is an authorization
  // the Relying Party asked for and did not get. Section 7.3's "exactly one PaSO-targeted entry" is
  // about the PaSO ones; this is the neighbours it does not describe how to combine with.
  if (allEntries.length !== pasoEntries.length) {
    throw new ParadymWalletPasoError(
      'mixedTransactionData',
      'This payment request combines a payment with other authorizations, which this wallet cannot authorize together.'
    )
  }

  const transactionDataType = pasoEntry.entry.transactionData.type
  const credentialIds = pasoEntry.entry.transactionData.credential_ids

  // [PaSO Core] Section 7.3: in the simple profile `credential_ids` contains exactly one identifier.
  if (credentialIds.length !== 1) {
    throw new ParadymWalletPasoError(
      'multipleCards',
      'This payment request offers multiple cards, which this wallet cannot authorize.'
    )
  }
  const [credentialQueryId] = credentialIds

  assertTrivialCredentialSets(resolvedRequest, credentialQueryId)

  const rulebook = getPasoRulebook(transactionDataType)
  if (!rulebook) {
    throw new ParadymWalletPasoError(
      'unsupportedTransactionType',
      `This wallet does not support transactions of type '${transactionDataType}'.`
    )
  }

  const allowedHashAlgorithms = pasoEntry.entry.transactionData.transaction_data_hashes_alg ?? [
    supportedTransactionDataHashAlgorithm,
  ]
  const [selectedHashAlgorithm] = credoTransactionDataHashAlgorithms.filter((algorithm) =>
    allowedHashAlgorithms.includes(algorithm)
  )
  if (selectedHashAlgorithm !== supportedTransactionDataHashAlgorithm) {
    throw new ParadymWalletPasoError(
      'unsupportedHashAlgorithm',
      'This payment request asks for a hash algorithm this wallet does not support.'
    )
  }

  const payload = pasoEntry.entry.transactionData.payload as Record<string, unknown> | undefined
  if (!payload || typeof payload !== 'object') {
    throw new ParadymWalletPasoError(
      'payloadDoesNotConform',
      'This payment request does not contain any payment details.'
    )
  }
  const paymentPayload = payload as unknown as PasoPaymentPayload
  const encodedEntry = pasoEntry.entry.encoded

  // 1. The credential matching the single credential query identifier.
  const submissionEntry = resolvedRequest.formattedSubmission.entries.find(
    (entry): entry is FormattedSubmissionEntrySatisfied =>
      entry.inputDescriptorId === credentialQueryId && entry.isSatisfied
  )

  // Nothing in the wallet can authorize this. The user still sees what they were asked to pay,
  // because the amount and the payee are in the request and the consent screen can say why it
  // cannot go ahead — which is more use than an error screen that hides the transaction. Without a
  // card there is no signed metadata, so the rulebook validates the payload on its own and the
  // labels come from the wallet.
  if (!submissionEntry) {
    const conformance = validatePasoPayloadConformance({ payload, rulebook })
    if (!conformance.conforms) {
      paradym.logger.error('PaSO transaction data payload does not conform to its rulebook', {
        reason: conformance.reason,
      })
      throw new ParadymWalletPasoError(
        'payloadDoesNotConform',
        'The payment details do not match what this type of payment allows.'
      )
    }

    return {
      type: pasoPaymentTransactionDataType,
      cardForTransactionId: credentialQueryId,
      amount: { value: paymentPayload.amount },
      payee: { value: paymentPayload.payee.name },
      hash: hashDecodedEntry(encodedEntry),
    }
  }

  const credentialRecord = submissionEntry.credentials[0].credential.record

  // 2a. The type must be supported by that credential, which only the signed metadata can say.
  //
  // Holding no metadata at all is worth telling apart from holding metadata that will not verify:
  // the first means this is not a PaSO Credential, and no amount of retrying will change it.
  if (!getPasoCredentialMetadata(credentialRecord)) {
    throw new ParadymWalletPasoError(
      'missingCredentialMetadata',
      'This card has no signed payment metadata, so it cannot authorize a payment.'
    )
  }

  const verifiedMetadata = await loadVerifiedPasoCredentialMetadata(paradym, {
    credentialRecord,
    requiredType: transactionDataType,
  })
  if (!verifiedMetadata) {
    throw new ParadymWalletPasoError(
      'invalidCredentialMetadata',
      'The payment metadata of this card could not be verified, or does not cover this type of payment.'
    )
  }

  const typeMetadata: PasoTransactionDataTypeMetadata =
    verifiedMetadata.credentialMetadata.transaction_data_types[transactionDataType]

  // [PaSO Proof Metadata] Section 3.3: "Independent of rendering, the Wallet SHALL treat a
  // transaction data type whose metadata violates these constraints as not supported by the
  // credential."
  const constraintIssue = findPasoMetadataConstraintIssue(typeMetadata)
  if (constraintIssue) {
    paradym.logger.error('PaSO transaction data type metadata violates its label constraints', {
      reason: constraintIssue,
    })
    throw new ParadymWalletPasoError(
      'metadataViolatesConstraints',
      'The payment metadata of this card cannot be displayed safely, so this payment cannot be authorized.'
    )
  }

  // [PaSO Risk Signals] Section 4.1 — the effective signal set, and with it the encryption trigger.
  const riskSignals = resolveEffectiveRiskSignalSet(typeMetadata)
  if ('unknownProfile' in riskSignals) {
    paradym.logger.error('PaSO transaction data type references an unknown risk signal profile', {
      profile: riskSignals.unknownProfile,
    })
    throw new ParadymWalletPasoError(
      'unknownRiskSignalProfile',
      'This payment requires risk signals this wallet does not know how to collect.'
    )
  }

  // [PaSO Risk Signals] Section 7: we cannot encrypt, and sending the signals in plaintext where
  // encryption was required is explicitly forbidden. Ceasing is the specified outcome.
  if (riskSignals.encryptionRequired) {
    throw new ParadymWalletPasoError(
      'riskSignalEncryptionRequired',
      'This payment requires encrypted risk signals, which this wallet does not support.'
    )
  }

  // 2b. Payload conformance against the rulebook and the card's claims metadata.
  const conformance = validatePasoPayloadConformance({ payload, rulebook, claimsMetadata: typeMetadata.claims })
  if (!conformance.conforms) {
    paradym.logger.error('PaSO transaction data payload does not conform to its rulebook', {
      reason: conformance.reason,
    })
    throw new ParadymWalletPasoError(
      'payloadDoesNotConform',
      'The payment details do not match what this type of payment allows.'
    )
  }

  // 3. Locale selection across every display array of the type, all or nothing.
  const displayArrays = [
    ...typeMetadata.claims.filter((claim) => claim.display).map((claim) => claim.display ?? []),
    ...pasoUiLabelKeys.map((key) => typeMetadata.ui_labels?.[key]).filter((entries) => entries !== undefined),
  ]
  const displayLocale = selectPasoLocale(localePriorityList, displayArrays)
  if (!displayLocale) {
    throw new ParadymWalletPasoError('noSupportedLocale', 'This payment cannot be shown in a language you understand.')
  }

  const uiLabel = (key: string) => resolveLocalisedEntry(typeMetadata.ui_labels?.[key], displayLocale)?.value
  const claimLabel = (path: string[]) =>
    resolveLocalisedEntry(findClaim(typeMetadata.claims, path)?.display, displayLocale)?.name

  // 4. External resources with integrity verification, resolved before consent is asked for.
  const payeeLogo = await resolveVerifiedLogo(paradym, paymentPayload)

  return {
    type: pasoPaymentTransactionDataType,
    cardForTransactionId: credentialQueryId,

    transactionTitle: uiLabel('transaction_title'),
    affirmativeActionLabel: uiLabel('affirmative_action_label'),
    denialActionLabel: uiLabel('denial_action_label'),
    securityHint: uiLabel('security_hint'),

    amount: { label: claimLabel(['amount']), value: paymentPayload.amount },
    payee: { label: claimLabel(['payee', 'name']), value: paymentPayload.payee.name },
    payeeLogo: payeeLogo ? { label: claimLabel(['payee', 'logo']), dataUrl: payeeLogo } : undefined,

    proof: {
      encodedEntry,
      // [PaSO Core] Section 6.1: the hash is over the base64url-encoded entry, which is the same
      // input OID4VP's own `transaction_data_hashes` uses — so the two agree by construction.
      transactionDataHash: TypedArrayEncoder.toBase64Url(
        Hasher.hash(encodedEntry, supportedTransactionDataHashAlgorithm)
      ),
      transactionDataHashAlgorithm: supportedTransactionDataHashAlgorithm,
      displayLocale,
      metadataIntegrity: verifiedMetadata.integrity,
      effectiveRiskSignalSet: riskSignals.signals,
    },

    hash: hashDecodedEntry(encodedEntry),
  }
}

/**
 * The key of the payment transaction status extension this wallet already speaks.
 *
 * Not a PaSO value, and not the same hash as `transaction_data_hash`: this one is over the *decoded*
 * entry, kept here so a PaSO flow can poll status the same way the TS 12 flow does where the
 * Attestation Provider offers it.
 */
function hashDecodedEntry(encodedEntry: string): string {
  return TypedArrayEncoder.toBase64Url(
    Hasher.hash(TypedArrayEncoder.fromBase64Url(encodedEntry), supportedTransactionDataHashAlgorithm)
  )
}

function findClaim(claims: PasoClaimMetadata[], path: string[]): PasoClaimMetadata | undefined {
  return claims.find((claim) => claim.path.length === path.length && claim.path.every((s, i) => s === path[i]))
}

/**
 * [PaSO Core] Sections 7.3 and 7.4 — the PaSO credential must be required in every alternative.
 *
 * A credential set that offers the PaSO credential in some alternatives but not others is the
 * advanced profile's territory: the displayed transaction data would have to change as the user
 * switches credentials. We do not implement that, so we reject rather than show one of the choices.
 */
function assertTrivialCredentialSets(resolvedRequest: CredentialsForProofRequest, credentialQueryId: string) {
  const dcqlQuery = (resolvedRequest.authorizationRequest as { dcql_query?: DcqlQuery }).dcql_query
  const credentialSets = dcqlQuery?.credential_sets
  if (!credentialSets) return

  for (const credentialSet of credentialSets) {
    const mentions = credentialSet.options.some((option) => option.includes(credentialQueryId))
    if (!mentions) continue

    if (!credentialSet.options.every((option) => option.includes(credentialQueryId))) {
      throw new ParadymWalletPasoError(
        'optionalCard',
        'This payment request offers the payment card as an optional choice, which this wallet cannot authorize.'
      )
    }
  }
}

/**
 * Resolves `payee.logo` into a `data:` URL, verifying it along the way.
 *
 * [PaSO Core] Section 7.4.2 step 3 makes failed resolution or verification an incompatibility, not a
 * warning — which is why an unusable logo throws rather than being dropped from the screen.
 *
 * The Payment rulebook makes the logo optional and lets a dedicated UI skip displaying it, so its
 * absence from the payload is not an error. A logo that is present and does not check out is.
 */
async function resolveVerifiedLogo(
  paradym: ParadymWalletSdk,
  payload: PasoPaymentPayload
): Promise<string | undefined> {
  const logo = payload.payee.logo
  if (!logo) return undefined

  const integrity = payload.payee['logo#integrity']
  const result = logo.startsWith('data:')
    ? validatePasoDataUrlImage(logo)
    : integrity
      ? await resolvePasoImageUrl(logo, integrity)
      : { error: 'the payee logo is missing its integrity value' }

  if ('error' in result) {
    paradym.logger.error('Could not resolve the PaSO payee logo', { reason: result.error })
    throw new ParadymWalletPasoError(
      'externalResourceVerificationFailed',
      'The payee logo of this payment could not be verified.'
    )
  }

  return result.dataUrl
}
