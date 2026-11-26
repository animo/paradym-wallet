import { Hasher, TypedArrayEncoder } from '@credo-ts/core'
import type { FormattedSubmissionEntrySatisfied } from '../format/submission'
import { getPasoCredentialMetadata } from '../metadata/credentials'
import type { CredentialsForProofRequest } from '../openid4vc/func/resolveCredentialRequest'
import { loadVerifiedPasoCredentialMetadata } from './credentialMetadata'
import { ParadymWalletPasoError, type PasoRefusalDetail } from './error'
import { findPasoMetadataConstraintIssue } from './labelConstraints'
import { resolveLocalisedEntry, selectPasoLocale } from './locale'
import {
  getPasoPaymentAmount,
  type PasoPaymentPayload,
  pasoPaymentTransactionDataType,
  validatePasoPayloadConformance,
} from './paymentRulebook'
import {
  getPasoPaymentDetails,
  interpolatePasoTemplate,
  type PasoDetailClaim,
  type PasoDisplayItem,
  type PasoPaymentDisplay,
  PasoRenderError,
  resolvePasoDisplayItems,
  resolvePasoPaymentDisplay,
  withoutDiscardedTemplateEntries,
} from './render'
import { selectPasoRiskSignalsEncryptionKey } from './riskSignalEncryption'
import { resolveEffectiveRiskSignalSet } from './riskSignals'
import { getPasoRulebook } from './rulebooks'
import type { PasoWallet } from './types'
import {
  isPasoTransactionDataType,
  type PasoClaimMetadata,
  type PasoResolvedRiskSignal,
  type PasoRiskSignalsEncryptionKey,
  type PasoTransactionDataTypeMetadata,
} from './types'

/**
 * Transaction data processing for the **simple profile**, per [PaSO Core] Section 7.3.
 *
 * Section 7.4's obligation for a Wallet without the advanced profile: it **SHALL reject** a request
 * with more than one PaSO-targeted entry, or with non-trivial PaSO credential sets, and inform the
 * user. Failing softly there — picking the first entry and carrying on — would show the user a
 * consent screen for a transaction the Relying Party did not ask them to authorize. So every such
 * case throws.
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
 * [PaSO Proof Metadata] Section 3.2 — the UI element identifiers this specification defines, plus
 * `payment_account_label`, which WPA Rulebook v1.1 Section 4.7.3 adds for the heading above the card.
 *
 * "The Wallet SHALL ignore any unrecognised UI element identifiers", which is why the list is used
 * for locale selection too: requiring a locale to cover a label we ignore would fail locales that
 * cover everything the user actually sees.
 */
const pasoUiLabelKeys = [
  'transaction_title',
  'affirmative_action_label',
  'denial_action_label',
  'security_hint',
  'payment_account_label',
]

interface FormattedTransactionDataPasoBase {
  /** The credential query id whose credential authorizes the transaction. */
  cardForTransactionId: string

  transactionTitle?: string
  affirmativeActionLabel?: string
  denialActionLabel?: string
  /** [PaSO Proof Metadata] Section 3.2 — shown exactly as provided, never replaced. */
  securityHint?: string
  /** WPA Rulebook v1.1 Section 4.7.2 level 5 — the heading above the card that pays. */
  paymentAccountLabel?: string

  /**
   * The claims without a display array, for a separate details view ([PaSO View] Section 2). Absent
   * on activities stored before it existed.
   */
  details?: PasoDetailClaim[]

  /**
   * Everything the proof needs, kept out of the way of the UI.
   *
   * Optional only because activities stored by earlier versions may not carry it.
   */
  proof?: {
    encodedEntry: string
    transactionDataHash: string
    transactionDataHashAlgorithm: string
    /** [PaSO Core] Section 6.1 `display_locale`. */
    displayLocale: string
    metadataIntegrity: string
    effectiveRiskSignalSet: PasoResolvedRiskSignal[]
    /**
     * The issuer key the `risk_signals` array is encrypted to, when encryption is required.
     *
     * Absent when it is not — [PaSO Risk Signals] Section 7.2 makes encryption a property of the
     * transaction data type, so this doubles as the record of which of the two forms of Section 5
     * and Section 7.5.1 the claim takes.
     */
    riskSignalsEncryptionKey?: PasoRiskSignalsEncryptionKey
    /** When the Authorization Request was processed, the `response_mode` signal's `collected_at`. */
    requestProcessedAt: Date
  }

  /** base64url SHA-256 over the *decoded* entry — see {@link hashDecodedEntry}. */
  hash: string
}

/**
 * A `urn:paso:sca:global:payment:1` entry, resolved and ready to show with the dedicated payment
 * hierarchy that [PaSO View] Section 1.1 allows and WPA Rulebook v1.1 Section 4.7.2 requires.
 *
 * Everything the consent screen needs, plus what {@link ./responseClaims.ts} needs afterwards to
 * build the holder binding proof — resolved once, because both the metadata verification and the
 * logo retrieval have side effects we do not want to repeat between consent and signing.
 */
export interface FormattedTransactionDataPasoPayment extends FormattedTransactionDataPasoBase, PasoPaymentDisplay {
  type: typeof pasoPaymentTransactionDataType
}

/**
 * Any other PaSO entry — a Mandate, a Generic one, or a type only its metadata describes — as the
 * rows of a generic consent screen.
 *
 * `type` is the wallet's own discriminant, like `qes_authorization`, so code that narrows on the
 * Payment type keeps doing so. The PaSO type is in {@link pasoType}.
 */
export interface FormattedTransactionDataPasoClaims extends FormattedTransactionDataPasoBase {
  type: 'paso_claims'
  pasoType: string
  items: PasoDisplayItem[]
}

export type FormattedTransactionDataPaso = FormattedTransactionDataPasoPayment | FormattedTransactionDataPasoClaims

export function isPasoTransaction(transaction?: { type: string }): transaction is FormattedTransactionDataPaso {
  return transaction?.type === pasoPaymentTransactionDataType || transaction?.type === 'paso_claims'
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
 * Refuses a request that would present a PaSO Credential without a PaSO transaction to authorize.
 *
 * A PaSO Credential — one holding signed PaSO credential metadata — exists to authorize payments,
 * and the Wero Payment Attestation Rulebook (Section 4.3) says so outright: the WPA "SHALL be used
 * solely to perform SCA for authorising a Wero payment". Shared on its own it would hand the payer's
 * account identifiers to any Relying Party that asks.
 *
 * Every candidate counts, not just the first: the user could otherwise pick the PaSO Credential
 * among them, and refusing up front is better than a consent screen whose only option is a card
 * that cannot be shared.
 */
export function assertPasoCredentialsOnlyForPasoTransactions(resolvedRequest: CredentialsForProofRequest) {
  if (hasPasoTransactionData(resolvedRequest)) return

  const requestsPasoCredential = resolvedRequest.formattedSubmission.entries.some(
    (entry) =>
      entry.isSatisfied &&
      entry.credentials.some(({ credential }) => getPasoCredentialMetadata(credential.record) !== null)
  )

  if (requestsPasoCredential) {
    throw new ParadymWalletPasoError(
      'credentialOnlyForPayments',
      'This request asks for a payment card without a payment to authorize, which this wallet does not allow.'
    )
  }
}

/** Which of the {@link PasoRefusalDetail} cases a Section 3.3 violation is. */
function classifyConstraintIssue(issue: string): PasoRefusalDetail {
  if (issue.includes('direction')) return 'directionalCharacters'
  if (issue.includes('value_type') || issue.includes('display_type')) return 'unsupportedValueType'
  return 'labelTooLong'
}

/**
 * [PaSO Proof Metadata] Section 5.3 — the ad-hoc metadata of an entry, once the Relying Party is
 * shown to be allowed to supply it. Any failure makes the entry incompatible, and "the Wallet SHALL
 * NOT fall back to the stored credential metadata entry".
 */
function verifyAdhocMetadata(
  metadata: unknown,
  clientId: string | undefined,
  verifiedMetadata: { credentialMetadata: Record<string, unknown> }
): PasoTransactionDataTypeMetadata {
  const allowedClients = verifiedMetadata.credentialMetadata.adhoc_metadata_clients
  if (!clientId || !Array.isArray(allowedClients) || !allowedClients.includes(clientId)) {
    throw new ParadymWalletPasoError(
      'invalidCredentialMetadata',
      'This payment request carries its own payment metadata, which its sender is not allowed to supply.'
    )
  }

  const candidate = metadata as Partial<PasoTransactionDataTypeMetadata> | null
  if (typeof candidate !== 'object' || candidate === null || !Array.isArray(candidate.claims)) {
    throw new ParadymWalletPasoError(
      'invalidCredentialMetadata',
      'This payment request carries payment metadata that is not well-formed.'
    )
  }

  return candidate as PasoTransactionDataTypeMetadata
}

/**
 * Resolves the single PaSO-targeted entry of a simple-profile request.
 *
 * Throws {@link ParadymWalletPasoError} with a user-facing reason for every case the spec says to
 * cease processing and inform the user.
 */
export async function resolvePasoTransactionData(
  paradym: PasoWallet,
  resolvedRequest: CredentialsForProofRequest,
  localePriorityList: string[]
): Promise<FormattedTransactionDataPaso> {
  const requestProcessedAt = new Date()

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
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ParadymWalletPasoError(
      'payloadDoesNotConform',
      'This payment request does not contain any payment details.'
    )
  }
  const encodedEntry = pasoEntry.entry.encoded

  // 1. The credential matching the single credential query identifier.
  const submissionEntry = resolvedRequest.formattedSubmission.entries.find(
    (entry): entry is FormattedSubmissionEntrySatisfied =>
      entry.inputDescriptorId === credentialQueryId && entry.isSatisfied
  )
  if (!submissionEntry) {
    throw new ParadymWalletPasoError('noMatchingCard', 'No card in this wallet can authorize this payment.')
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

  // [PaSO Proof Metadata] Section 5.4: valid ad-hoc metadata makes a type supported even when the
  // signed metadata does not publish it, so the signed metadata is only required to cover the type
  // when there is no ad-hoc metadata.
  const adhocMetadata = (pasoEntry.entry.transactionData as { metadata?: unknown }).metadata
  const verifiedMetadata = await loadVerifiedPasoCredentialMetadata(paradym, {
    credentialRecord,
    requiredType: adhocMetadata === undefined ? transactionDataType : undefined,
  })
  if (!verifiedMetadata) {
    throw new ParadymWalletPasoError(
      'invalidCredentialMetadata',
      'The payment metadata of this card could not be verified, or does not cover this type of payment.'
    )
  }

  const typeMetadata: PasoTransactionDataTypeMetadata =
    adhocMetadata === undefined
      ? verifiedMetadata.credentialMetadata.transaction_data_types[transactionDataType]
      : verifyAdhocMetadata(
          adhocMetadata,
          (resolvedRequest.authorizationRequest as { client_id?: string }).client_id,
          verifiedMetadata
        )

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
      'The payment metadata of this card cannot be displayed safely, so this payment cannot be authorized.',
      classifyConstraintIssue(constraintIssue)
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

  // [PaSO Risk Signals] Section 7.3 — the issuer key the signals are encrypted to, taken from the
  // metadata JWT verified just above because "a key that is not integrity-verified SHALL be treated
  // as absent". Resolved here rather than at signing time so a card whose issuer published no usable
  // key refuses before the user is asked to consent, which is what "treat the entry as incompatible"
  // asks for — the alternative is a consent screen for a payment that cannot be sent.
  const riskSignalsEncryptionKey = riskSignals.encryptionRequired
    ? selectPasoRiskSignalsEncryptionKey(verifiedMetadata.credentialMetadata)
    : undefined
  if (riskSignals.encryptionRequired && !riskSignalsEncryptionKey) {
    paradym.logger.error(
      'PaSO transaction data type requires encrypted risk signals, but no usable issuer key is published'
    )
    throw new ParadymWalletPasoError(
      'riskSignalEncryptionKeyUnavailable',
      'This payment requires encrypted risk signals, but this card publishes no key to encrypt them to.'
    )
  }

  const rulebook = getPasoRulebook(transactionDataType, payload, typeMetadata.claims)
  if (!rulebook) {
    throw new ParadymWalletPasoError(
      'unsupportedTransactionType',
      `This wallet does not support transactions of type '${transactionDataType}'.`
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
      'The payment details do not match what this type of payment allows.',
      conformance.reason.includes('direction') ? 'directionalCharacters' : undefined
    )
  }

  // 3. Locale selection across every display array of the type, all or nothing. A template label
  // that references a claim the payload leaves out is discarded before selection runs.
  let claims: PasoClaimMetadata[]
  try {
    claims = withoutDiscardedTemplateEntries(typeMetadata.claims, payload)
  } catch (error) {
    throw toRenderRefusal(paradym, error)
  }
  const displayArrays = [
    ...claims.filter((claim) => claim.display).map((claim) => claim.display ?? []),
    ...pasoUiLabelKeys.map((key) => typeMetadata.ui_labels?.[key]).filter((entries) => entries !== undefined),
  ]
  const displayLocale = selectPasoLocale(localePriorityList, displayArrays)
  if (!displayLocale) {
    throw new ParadymWalletPasoError('noSupportedLocale', 'This payment cannot be shown in a language you understand.')
  }

  const uiLabel = (key: string) => {
    const entry = resolveLocalisedEntry(typeMetadata.ui_labels?.[key], displayLocale)
    if (!entry?.value_type?.startsWith('template:')) return entry?.value

    // shortcut: a templated UI label is interpolated with the raw claim values, not the formatted
    // ones, and is left out rather than discarded before locale selection when a claim is missing.
    // Upgrade when an issuer templates its UI labels.
    const parts = interpolatePasoTemplate(entry.value, claims, payload)
    return parts === 'absent'
      ? undefined
      : parts.map((part) => (typeof part === 'string' ? part : String(part.value))).join('')
  }

  const base: FormattedTransactionDataPasoBase = {
    cardForTransactionId: credentialQueryId,

    transactionTitle: uiLabel('transaction_title'),
    affirmativeActionLabel: uiLabel('affirmative_action_label'),
    denialActionLabel: uiLabel('denial_action_label'),
    securityHint: uiLabel('security_hint'),
    paymentAccountLabel: uiLabel('payment_account_label'),

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
      riskSignalsEncryptionKey,
      requestProcessedAt,
    },

    hash: hashDecodedEntry(encodedEntry),
  }

  // 4. Values, with external resources resolved and verified before consent is asked for.
  try {
    if (transactionDataType === pasoPaymentTransactionDataType) {
      const paymentPayload = payload as unknown as PasoPaymentPayload
      return {
        ...base,
        type: pasoPaymentTransactionDataType,
        details: getPasoPaymentDetails(payload, claims),
        ...(await resolvePasoPaymentDisplay({
          payload,
          amount: getPasoPaymentAmount(paymentPayload),
          claims,
          locale: displayLocale,
        })),
      }
    }

    const { items, details } = await resolvePasoDisplayItems({
      payload,
      claims,
      rulebook,
      locale: displayLocale,
      resolveEmbeddedPayment: (embeddedPayload, embeddedClaims) =>
        resolvePasoPaymentDisplay({
          payload: embeddedPayload,
          amount: getPasoPaymentAmount(embeddedPayload as unknown as PasoPaymentPayload),
          claims: embeddedClaims,
          locale: displayLocale,
        }),
    })
    return { ...base, type: 'paso_claims', pasoType: transactionDataType, items, details }
  } catch (error) {
    throw toRenderRefusal(paradym, error)
  }
}

/**
 * [PaSO Core] Section 7.4.2 step 3 makes a resource that fails to resolve or verify an
 * incompatibility, and [PaSO View] Sections 2 and 3 do the same for labels and values that can't be
 * shown in full — so every render failure refuses the transaction.
 */
function toRenderRefusal(paradym: PasoWallet, error: unknown) {
  if (!(error instanceof PasoRenderError)) return error

  paradym.logger.error('PaSO transaction data cannot be displayed', { reason: error.message })
  return error.detail === 'imageNotVerified'
    ? new ParadymWalletPasoError(
        'externalResourceVerificationFailed',
        'An image in this payment could not be verified.',
        error.detail
      )
    : new ParadymWalletPasoError(
        'payloadDoesNotConform',
        'The payment details cannot be displayed safely, so this payment cannot be authorized.',
        error.detail
      )
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

  for (const credentialSet of credentialSets as Array<(typeof credentialSets)[number] & { required?: boolean }>) {
    const mentions = credentialSet.options.some((option) => option.includes(credentialQueryId))
    if (!mentions) continue

    // An optional set (`required: false`) makes the card optional as a whole, even when every one of
    // its options contains it.
    if (
      credentialSet.required === false ||
      !credentialSet.options.every((option) => option.includes(credentialQueryId))
    ) {
      throw new ParadymWalletPasoError(
        'optionalCard',
        'This payment request offers the payment card as an optional choice, which this wallet cannot authorize.'
      )
    }
  }
}
