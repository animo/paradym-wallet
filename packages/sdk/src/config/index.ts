import type { InitConfig, Kms, X509ModuleConfigOptions } from '@credo-ts/core'
import type { OpenId4VciCredentialBindingOptions } from '@credo-ts/openid4vc'
import type { LogLevel, ParadymWalletSdkLogger } from '../logging'
import type { TrustMechanismConfiguration } from '../trust/trustMechanism'
import type { ResolveAttributeLabel } from './attributeLabel'
import type { ResolveDcApiDisplay } from './dcApiDisplay'

/**
 *
 * Base id of the askar store, used when the wallet does not provide one
 *
 */
export const defaultWalletId = 'paradym-wallet'

/**
 *
 * Language the wallet renders credentials in, as a BCP 47 tag.
 *
 * Defaults to English. Change it while the wallet is open with `paradym.setLocale` — a credential's
 * display is derived per locale, so switching re-derives rather than going stale.
 */
export type ParadymWalletSdkLocaleOptions = {
  locale?: string
}

/**
 *
 * How the wallet names claims the credential did not name — see {@link ResolveAttributeLabel}.
 *
 */
export type ParadymWalletSdkAttributeLabelOptions = {
  resolveAttributeLabel?: ResolveAttributeLabel
}

/**
 *
 * What the OS credential picker shows for a credential — see {@link ResolveDcApiDisplay}.
 *
 */
export type ParadymWalletSdkDcApiDisplayOptions = {
  resolveDcApiDisplay?: ResolveDcApiDisplay
}

/**
 *
 * How the key a received credential is bound to is created.
 *
 * Every field is optional, and anything left out falls back to the default.
 *
 */
export type CredentialKeyOptions = {
  /**
   *
   * Key management backend the key is created in: `'secureEnvironment'` for a hardware key (Secure
   * Enclave / Android Keystore). Defaults to `'askar'`.
   *
   * Hardware keys never leave the device: a credential bound to one cannot be restored from a backup.
   *
   */
  backend?: string

  /**
   *
   * JWA signature algorithm the key is created for, which decides its type: `ES256` for a P-256
   * key, `EdDSA` for an Ed25519 key. It must be one of `proofTypes.jwt.supportedSignatureAlgorithms`
   * in the options passed to {@link ResolveCredentialKeyOptions}, and the backend must support it.
   * The secure environment only supports `ES256`.
   *
   * Defaults to the first algorithm the issuer supports.
   *
   */
  algorithm?: Kms.KnownJwaSignatureAlgorithm
}

/**
 *
 * How the key a received credential is bound to is created — see {@link CredentialKeyOptions}.
 *
 * Called once per credential configuration requested over OpenID4VCI, with the options Credo hands
 * the credential binding resolver: the credential configuration (format, `vct`, `doctype`), the
 * issuer metadata and the proof types it accepts. Return `undefined` for the defaults.
 *
 */
export type ResolveCredentialKeyOptions = (
  options: OpenId4VciCredentialBindingOptions
) => CredentialKeyOptions | undefined | Promise<CredentialKeyOptions | undefined>

export type ParadymWalletSdkCredentialKeyOptions = {
  resolveCredentialKeyOptions?: ResolveCredentialKeyOptions
}

export type ParadymWalletSdkLoggingOptions<T extends ParadymWalletSdkLogger = ParadymWalletSdkLogger> = {
  /**
   *
   * Loglevel to be used. Set to `trace` to log everything and `off` for nothing
   *
   */
  level: LogLevel

  /**
   *
   * Whether to trace the logs. Later, this can be exported
   *
   * exporting the logs can be done with the following:
   *
   * ```typescript
   * const { paradym } = useParadym('unlocked')
   * const logs = paradym.logger.loggedMessageContents
   * ```
   *
   */
  trace?: boolean

  /**
   *
   * Number of logs to be traced.
   *
   */
  traceLimit?: number

  /**
   *
   * Provide a custom logger which implements the `ParadymWalletSdkLogger` interface.
   *
   */
  customLogger?: new (
    logLevel: LogLevel
  ) => T
}

/**
 *
 * Configuration shared by every agent the wallet runs.
 *
 * The credential request UI answers requests from its own process — the identity document provider
 * extension on iOS, the activity the credential picker launches on Android — with
 * {@link import('./dcApi/ParadymDcApiSdk').ParadymDcApiSdk} rather than the full SDK, so it cannot
 * take the app's configuration object as a whole. Everything that has to be identical between the
 * two is spelled here, so one object can be passed to both: the same store, the same logging, and
 * above all the same trust.
 *
 * DIDComm is deliberately not part of it — nothing outside the app speaks it.
 *
 */
export type ParadymWalletSdkSharedOptions = {
  /**
   *
   * Unique identifier of your wallet storage
   *
   */
  id?: string

  /**
   *
   * Absolute path of the askar sqlite database
   *
   * @note when not provided Credo derives it from the framework data path, which on iOS is inside
   *       the app's own container and therefore unreachable from app extensions
   *
   */
  storePath?: string

  /**
   *
   * Configuration regarding logging with the Paradym Wallet SDK
   *
   */
  logging?: ParadymWalletSdkLoggingOptions

  /**
   *
   * Configuration for when OpenId4Vc is used
   *
   * @note by default, openid4vc is configured on the agent
   *
   * @note to disable openid4vc, pass in `false`
   *
   * @note the trusted x509 certificates are derived from the `trustMechanisms` entry where
   *       `trustMechanism === 'x509'`, so they don't have to be specified here
   *
   */
  openId4VcConfiguration?: Omit<X509ModuleConfigOptions, 'trustedCertificates'> | false

  /**
   *
   * Callback resolving the trust anchors a signer is verified against
   *
   * @note this is the only hook the mdoc reader authentication of an ISO 18013-7 Annex C request
   *       reaches. `openId4VcConfiguration.getTrustedCertificatesForVerification` is scoped to the
   *       x509 module and is never consulted for `mdocReaderAuth`
   *
   * @note returning `undefined` falls through to the x509 callback and then to the certificates
   *       derived from `trustMechanisms`, so it only has to answer the contexts it cares about
   *
   */
  getTrustedIssuersForVerification?: InitConfig['getTrustedIssuersForVerification']

  /**
   *
   * Trust mechanisms supported by the wallet
   *
   * The order matters. The first index will be tried first, until the last
   *
   * When one is found that works, it will be used
   *
   */
  trustMechanisms?: TrustMechanismConfiguration[]
}

/**
 *
 * The x509 certificates the wallet trusts, taken from the `x509` trust mechanism.
 *
 * They are configured once, as part of the trust mechanisms, and turned into the agent's trusted
 * certificates here — so the app and the credential request UI verify against the same roots.
 *
 */
export const getTrustedX509Certificates = (trustMechanisms: TrustMechanismConfiguration[] = []) =>
  trustMechanisms
    .filter(
      (trustMechanism): trustMechanism is Extract<TrustMechanismConfiguration, { trustMechanism: 'x509' }> =>
        'trustMechanism' in trustMechanism && trustMechanism.trustMechanism === 'x509'
    )
    .flatMap((trustMechanism) => trustMechanism.trustedX509Entities.map((entity) => entity.certificate))
