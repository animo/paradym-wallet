import type { X509ModuleConfigOptions } from '@credo-ts/core'
import type { LogLevel, ParadymWalletSdkLogger } from './logging'
import type { TrustMechanismConfiguration } from './trust/trustMechanism'

/**
 *
 * Base id of the askar store, used when the wallet does not provide one
 *
 */
export const defaultWalletId = 'paradym-wallet'

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
