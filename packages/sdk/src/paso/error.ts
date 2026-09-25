import { ParadymWalletSdkError } from '../error'

/**
 * Why a PaSO transaction was refused.
 *
 * PaSO asks the Wallet to "cease processing and inform the user" in a dozen places ([PaSO Core]
 * Sections 7.3 and 7.4, [PaSO Risk Signals] Section 7.3, [PaSO Proof Metadata] Section 5). Informing
 * the user means saying which of them happened — "something went wrong" leaves someone staring at a
 * checkout they cannot complete with no idea whether to retry, update the app, or call their bank.
 *
 * A code rather than a sentence, because the wallet is translated and the SDK is not.
 */
export type PasoRefusalCode =
  /** [PaSO Core] Section 3 — the Authorization Request was not signed. */
  | 'requestNotSigned'
  /** [PaSO Core] Section 7.4 — more than one PaSO-targeted transaction data entry. */
  | 'multipleTransactions'
  /** The request pairs the PaSO entry with transaction data this wallet cannot sign alongside it. */
  | 'mixedTransactionData'
  /** [PaSO Core] Section 7.3 — `credential_ids` holds more than one credential query identifier. */
  | 'multipleCards'
  /** [PaSO Core] Section 7.4 — a credential set makes the PaSO credential an optional choice. */
  | 'optionalCard'
  /** No Transaction Data Type Rulebook for this `type` is implemented. */
  | 'unsupportedTransactionType'
  /** None of the entry's `transaction_data_hashes_alg` values is supported. */
  | 'unsupportedHashAlgorithm'
  /** [PaSO Proof Metadata] Section 3 — no signed credential metadata JWT is held for the credential. */
  | 'missingCredentialMetadata'
  /** [PaSO Proof Metadata] Sections 5 and 6 — the stored metadata failed verification, or lacks the type. */
  | 'invalidCredentialMetadata'
  /** [PaSO Proof Metadata] Section 3.3 — the metadata's labels break the constraints on them. */
  | 'metadataViolatesConstraints'
  /** [PaSO Risk Signals] Section 4.1 — a referenced risk signal profile this wallet cannot resolve. */
  | 'unknownRiskSignalProfile'
  /** [PaSO Risk Signals] Section 7 — encryption is required and this wallet cannot encrypt. */
  | 'riskSignalEncryptionRequired'
  /** [PaSO Core] Section 7.3 step 2 — the payload does not conform to the rulebook. */
  | 'payloadDoesNotConform'
  /** [PaSO View] Section 4 — no locale produced a complete match. */
  | 'noSupportedLocale'
  /** [PaSO Core] Section 7.4.2 step 3 — an external resource failed to resolve or verify. */
  | 'externalResourceVerificationFailed'

export class ParadymWalletPasoError extends ParadymWalletSdkError {
  public constructor(
    public readonly code: PasoRefusalCode,
    message: string
  ) {
    super(message)
  }
}
