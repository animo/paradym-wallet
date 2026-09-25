import type {
  PasoAuthenticationMethod,
  PasoResolvedRiskSignal,
  PasoRiskSignalEnumerationEntry,
  PasoRiskSignalEnvelope,
  PasoRiskSignalProfile,
  PasoTransactionDataTypeMetadata,
} from './types'

/**
 * Risk signals, per [PaSO Proof Risk Signals] and [PaSO Risk Signal Registry].
 *
 * This is where PaSO draft-2 diverges most sharply from TS 12 and from earlier PaSO drafts: `amr`
 * and `response_mode` are no longer holder binding proof claims. They are *risk signals*, carried
 * inside a single `risk_signals` claim, and they are only present when a referenced risk signal
 * profile — or an enumeration in the credential metadata — says so. [PaSO Core] Section 6.1 is
 * explicit that a PaSO transaction evidences Strong Customer Authentication only where the profile
 * in force requires the `amr` signal; nothing applies a profile implicitly.
 *
 * This wallet produces the two **transaction-fact** signals of [PaSO Risk Signal Registry] Sections
 * 2.7 and 2.8, which need no sensor and no permission. The measured signals (Sections 2.1 to 2.4)
 * and the device-fact signals (Sections 2.5 and 2.6) are not collected; when a profile requires them
 * they are reported with `status: 'unavailable'`, which Section 4.2 explicitly provides for:
 *
 *   "A Wallet that does not implement a signal type resolved as required SHALL include that signal's
 *   envelope with `status` set to `unavailable`. The Wallet SHALL NOT treat an unimplemented required
 *   signal as rendering the `transaction_data` entry incompatible."
 *
 * Silently omitting them is the violation — the Authorizing Party must reject a proof with a
 * required signal missing (Section 6 step 1), so an omission fails the transaction while an honest
 * `unavailable` leaves the decision where the spec puts it.
 */

export const pasoResponseModeSignalType = 'urn:paso:risk:global:response_mode:1'
export const pasoAuthenticationMethodsSignalType = 'urn:paso:risk:global:amr:1'

/**
 * The risk signal profiles this wallet knows how to resolve.
 *
 * A profile is a governance document, not a fetchable resource — [PaSO Risk Signals] Section 3.3
 * only asks that it be published "in a form an implementer can transcribe without ambiguity". So
 * transcribing it is the intended integration, not a shortcut. Which makes transcribing it
 * *accurately* the whole job: a profile short of a signal produces proofs the Authorizing Party has
 * to reject, and a profile missing `encrypted` produces proofs that leak what it was meant to hide.
 */
const knownRiskSignalProfiles: Record<string, PasoRiskSignalProfile> = {
  // https://aptitude-consortium.github.io/payments-and-sca-for-openid/draft-2/rulebooks/risk_profiles/Default/
  //
  // All seven signals of the registry except `amr`, every one of them required with a ten-minute
  // freshness bound — and `encrypted: true`. The six this wallet does not measure are reported
  // `unavailable` per Section 4.2, and the array is encrypted to the issuer's key per Section 7, so
  // referencing this profile is usable here as long as the issuer publishes one.
  'urn:paso:risk-profile:global:default:1': {
    encrypted: true,
    signals: [
      { type: pasoResponseModeSignalType, required: true, max_age: 600 },
      { type: 'urn:paso:risk:global:geolocation:1', required: true, max_age: 600 },
      { type: 'urn:paso:risk:global:call_activity:1', required: true, max_age: 600 },
      { type: 'urn:paso:risk:global:device_motion:1', required: true, max_age: 600 },
      { type: 'urn:paso:risk:global:screen_capture:1', required: true, max_age: 600 },
      { type: 'urn:paso:risk:global:device_basics:1', required: true, max_age: 600 },
      { type: 'urn:paso:risk:global:app_vendor_id:1', required: true, max_age: 600 },
    ],
  },
}

export type PasoRiskSignalResolution =
  /** A referenced profile this wallet cannot resolve, so neither its signals nor its `encrypted`. */
  { unknownProfile: string } | { signals: PasoResolvedRiskSignal[]; encryptionRequired: boolean }

/**
 * The effective signal set for a transaction data type, per [PaSO Risk Signals] Section 4.1.
 *
 * Union of every referenced profile — `required` ORs, `max_age` takes the minimum — then the
 * metadata enumeration applied as a ratchet: it may add a type, promote `required` to `true`, or
 * lower `max_age`, and never the reverse. An enumeration that tries to loosen is not an error; the
 * stricter value simply wins.
 *
 * The encryption trigger is resolved here rather than by a separate call, because it has three
 * independent sources (Section 7.2) and the profile is the one that is easiest to forget: the
 * published Default profile sets `encrypted`, so reading only the metadata's own flag silently sends
 * plaintext device and behavioural data to a Relying Party the profile meant to exclude.
 *
 * An unknown profile is reported rather than skipped. Skipping it produces a proof missing signals
 * the Authorizing Party resolves as required and must reject (Section 6 step 1), and — worse — hides
 * an `encrypted` flag we would then violate. Refusing with a reason is the honest outcome.
 */
export function resolveEffectiveRiskSignalSet(
  typeMetadata: PasoTransactionDataTypeMetadata | undefined
): PasoRiskSignalResolution {
  const resolved = new Map<string, PasoResolvedRiskSignal>()

  // The strictest constraint wins in every case, which makes unioning profiles and applying the
  // enumeration ratchet the same operation.
  const apply = (entry: PasoRiskSignalEnumerationEntry) => {
    const existing = resolved.get(entry.type)
    if (!existing) {
      resolved.set(entry.type, {
        type: entry.type,
        required: entry.required ?? false,
        maxAge: entry.max_age,
      })
      return
    }

    existing.required = existing.required || (entry.required ?? false)
    if (entry.max_age !== undefined) {
      existing.maxAge = existing.maxAge === undefined ? entry.max_age : Math.min(existing.maxAge, entry.max_age)
    }
  }

  // Section 7.2 items 1 and 2. Item 1, the rulebook, is the Basic Payments rulebook here, which does
  // not mandate encryption; item 3, the profiles, is folded in below.
  let encryptionRequired = typeMetadata?.encrypted === true

  for (const profileId of typeMetadata?.risk_signal_profiles ?? []) {
    const profile = knownRiskSignalProfiles[profileId]
    if (!profile) return { unknownProfile: profileId }

    if (profile.encrypted) encryptionRequired = true
    for (const entry of profile.signals) apply(entry)
  }

  for (const entry of typeMetadata?.risk_signals ?? []) apply(entry)

  return { signals: [...resolved.values()], encryptionRequired }
}

export interface PasoRiskSignalContext {
  /** The `response_mode` of the Authorization Request, as given or defaulted. */
  responseMode: string
  /** How the user released the transaction, per [PaSO Risk Signal Registry] Section 2.8. */
  authenticationMethods: PasoAuthenticationMethod[]
  /** When the user completed authentication, which Section 2.8 makes the signal's `collected_at`. */
  authenticatedAt: Date
}

/**
 * The `risk_signals` claim value, or `undefined` when the effective set requires nothing.
 *
 * [PaSO Risk Signals] Section 4.2: an envelope is produced for every *required* signal, carrying its
 * `status` even where no value could be obtained. When nothing is required the claim is omitted
 * entirely — which is the normal case, since no profile applies unless the issuer's metadata
 * references one.
 *
 * Section 4.3 adds the freshness rule, applied "at the moment it produces the holder binding proof
 * signature": a measurement older than its resolved `max_age` is re-taken or carried as
 * `unavailable`. Nothing here is cached — the two signals this wallet produces are read at signing
 * time — but the bound is enforced anyway, because the moment a cached measurement is introduced the
 * alternative is a proof the Authorizing Party rejects for staleness with no indication why.
 */
export function collectPasoRiskSignals(
  effectiveSignalSet: PasoResolvedRiskSignal[],
  context: PasoRiskSignalContext
): PasoRiskSignalEnvelope[] | undefined {
  const required = effectiveSignalSet.filter((signal) => signal.required)
  if (required.length === 0) return undefined

  const now = new Date()
  const isFresh = (signal: PasoResolvedRiskSignal, collectedAt: Date) =>
    signal.maxAge === undefined || now.getTime() - collectedAt.getTime() <= signal.maxAge * 1000

  return required.map((signal): PasoRiskSignalEnvelope => {
    if (signal.type === pasoResponseModeSignalType && isFresh(signal, now)) {
      return { type: signal.type, collected_at: now.toISOString(), status: 'ok', value: context.responseMode }
    }

    if (signal.type === pasoAuthenticationMethodsSignalType && isFresh(signal, context.authenticatedAt)) {
      return {
        type: signal.type,
        collected_at: context.authenticatedAt.toISOString(),
        status: 'ok',
        value: context.authenticationMethods,
      }
    }

    // A signal type this wallet does not implement, or one whose measurement has aged out. Section
    // 4.2: report it, do not omit it, and do not treat it as making the entry incompatible — whether
    // to accept is the Authorizing Party's call, not ours.
    return { type: signal.type, collected_at: now.toISOString(), status: 'unavailable' }
  })
}
