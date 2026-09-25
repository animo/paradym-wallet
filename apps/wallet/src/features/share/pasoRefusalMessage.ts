import { useLingui } from '@lingui/react/macro'
import type { PasoRefusalCode } from '@paradym/wallet-sdk'
import { useCallback } from 'react'

/**
 * Turns a PaSO refusal into something the user can act on.
 *
 * PaSO tells the Wallet to "cease processing and inform the user" in a dozen places, and the useful
 * part is *which* of them happened: a request the wallet is too old to handle, a card without
 * verified metadata, and a payee logo that failed its integrity check lead to three different next
 * steps. The SDK is not translated, so it hands back a code and the wording lives here.
 */
export function usePasoRefusalMessage() {
  const { t } = useLingui()

  return useCallback(
    (code: PasoRefusalCode): string => {
      switch (code) {
        case 'requestNotSigned':
          return t({
            id: 'paso.refusal.requestNotSigned',
            message: 'This payment request is not signed, so it cannot be authorized.',
            comment: 'Shown when a PaSO payment request arrives without a signature',
          })
        case 'multipleTransactions':
        case 'multipleCards':
        case 'optionalCard':
        case 'mixedTransactionData':
          return t({
            id: 'paso.refusal.tooComplex',
            message: 'This payment request is more complex than this wallet can authorize.',
            comment: 'Shown when a PaSO payment request needs features the wallet does not support',
          })
        case 'unsupportedTransactionType':
        case 'unsupportedHashAlgorithm':
        case 'unknownRiskSignalProfile':
          return t({
            id: 'paso.refusal.unsupported',
            message: 'This payment uses features this wallet does not support yet.',
            comment: 'Shown when a PaSO payment request uses an unsupported type or algorithm',
          })
        case 'metadataViolatesConstraints':
          return t({
            id: 'paso.refusal.metadataViolatesConstraints',
            message: 'The details of this payment cannot be shown safely, so it cannot be authorized.',
            comment: 'Shown when PaSO credential metadata breaks the constraints on what may be displayed',
          })
        // The card's signed metadata is the only place a risk signal encryption key may come from
        // ([PaSO Risk Signals] Section 7.3), so a missing one is a metadata problem the issuer fixes
        // and the wallet picks up on the next renewal — same advice as the two cases above.
        case 'riskSignalEncryptionKeyUnavailable':
        case 'missingCredentialMetadata':
        case 'invalidCredentialMetadata':
          return t({
            id: 'paso.refusal.invalidCredentialMetadata',
            message: 'The payment details of your card could not be verified. Try again later.',
            comment: 'Shown when the signed PaSO credential metadata is missing or fails verification',
          })
        case 'payloadDoesNotConform':
          return t({
            id: 'paso.refusal.payloadDoesNotConform',
            message: 'The payment details are not valid, so this payment cannot be authorized.',
            comment: 'Shown when a PaSO payload does not conform to its rulebook',
          })
        case 'noSupportedLocale':
          return t({
            id: 'paso.refusal.noSupportedLocale',
            message: 'This payment cannot be shown in a language you understand.',
            comment: 'Shown when no locale produces a complete match for the PaSO transaction data',
          })
        case 'externalResourceVerificationFailed':
          return t({
            id: 'paso.refusal.externalResourceVerificationFailed',
            message: 'The payee logo of this payment could not be verified.',
            comment: 'Shown when a PaSO external resource fails its integrity check',
          })
      }
    },
    [t]
  )
}
