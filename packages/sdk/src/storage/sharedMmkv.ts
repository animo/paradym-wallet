import { Platform } from 'react-native'
import { createMMKV, existsMMKV, type MMKV } from 'react-native-mmkv'
import { getAppGroupContainerPath } from '../dcApi/appGroup'

/**
 * The settings both halves of the wallet read, with the type each is stored as.
 *
 * MMKV getters are typed, so a copy has to know what it is copying. Anything not listed here is
 * reported by {@link migrate} rather than moved, so a new key cannot go missing unnoticed.
 */
const sharedKeys = {
  arePermissionsRequested: 'boolean',
  biometricsEnabled: 'boolean',
  hasFinishedOnboarding: 'boolean',
  hasSeenIntroTooltip: 'boolean',
  shouldUseCloudHsm: 'boolean',
  useDevelopmentMode: 'boolean',
  useStoredLocale: 'string',
  walletKeyVersion: 'number',
} as const

/**
 * Where MMKV keeps its files, or `undefined` for its own default.
 *
 * On iOS that is the container shared with the identity document provider extension: it is a
 * separate process that cannot see the app's own container, and the credential request UI needs the
 * same settings the app writes — the wallet key version above all, since it names the askar store.
 *
 * On Android the request UI runs in the app's sandbox, so the default location is already shared.
 */
function getSharedMmkvPath() {
  if (Platform.OS !== 'ios') return undefined

  const containerPath = getAppGroupContainerPath()
  return containerPath ? `${containerPath}/mmkv` : undefined
}

/** MMKV's own default, which is what the settings have always been stored under. */
const defaultInstanceId = 'mmkv.default'

/**
 * Written into the store the settings came from once they have been copied out of it.
 *
 * The copy cannot be recognised by the shared store having keys: it can be emptied afterwards — a
 * wallet reset clears some — and the originals are deliberately left in place, so that would copy
 * stale settings back over a reset.
 */
const migratedKey = 'mmkvMigratedToSharedContainer'

let shared: MMKV | undefined

/**
 * The MMKV instance the app, the SDK and the credential request UI all read.
 *
 * Memoised, and migrated on the first call rather than at some point during startup: both the SDK
 * and the app construct this at module scope, so there is no ordering in which a migration step
 * could be guaranteed to run first.
 */
export function getSharedMmkv(): MMKV {
  if (shared) return shared

  const path = getSharedMmkvPath()
  // `multi-process` is what MMKV calls the mode for app extensions: it takes a cross-process lock
  // rather than assuming this app is the only writer.
  shared = createMMKV(path ? { id: defaultInstanceId, path, mode: 'multi-process' } : undefined)

  // Creating the instance before migrating into it is deliberate, and safe: MMKV is synchronous, so
  // nothing else in this process runs in between, and {@link migrate} decides by key count rather
  // than by whether the file exists — creating an empty one does not make it look already migrated.
  // `shared` is assigned first so a re-entrant call gets this instance instead of building a second.
  //
  // Only where there is something to migrate: the credential request UI has its own default path,
  // which never held the app's settings, and opening it would leave an empty store behind.
  if (path && existsMMKV(defaultInstanceId)) migrate(shared)

  return shared
}

/**
 * Copy the settings out of the store in the app's own container, which is where they lived before
 * the request UI needed them.
 *
 * The originals are left in place: this runs before anything has read the shared store, and keeping
 * them means a build without the shared container still finds the user's settings.
 */
function migrate(target: MMKV) {
  // Fast path, so a migrated install never opens the old store again.
  if (target.getAllKeys().length > 0) return

  const source = createMMKV()
  if (source.getBoolean(migratedKey)) return

  const keys = source.getAllKeys()
  if (keys.length === 0) return

  for (const key of keys) {
    const type = sharedKeys[key as keyof typeof sharedKeys]

    if (type === 'boolean') {
      const value = source.getBoolean(key)
      if (value !== undefined) target.set(key, value)
    } else if (type === 'number') {
      const value = source.getNumber(key)
      if (value !== undefined) target.set(key, value)
    } else if (type === 'string') {
      const value = source.getString(key)
      if (value !== undefined) target.set(key, value)
    } else {
      console.warn(`[mmkv] '${key}' is not a known shared setting and was left in the app container`)
    }
  }

  source.set(migratedKey, true)
}

/**
 * The wallet key version, which namespaces the askar store as well as the keychain items holding
 * the wallet key and its salt.
 *
 * Lives here rather than next to the rest of the wallet key handling because the credential request
 * UI needs it too, and cannot import a module that pulls in askar and react-query.
 */
export function getWalletKeyVersion() {
  return getSharedMmkv().getNumber('walletKeyVersion') ?? 1
}

export function setWalletKeyVersion(version: number) {
  getSharedMmkv().set('walletKeyVersion', version)
}

/**
 * The locale the user picked, or `undefined` to follow the device.
 */
export function getStoredLocale() {
  return getSharedMmkv().getString('useStoredLocale')
}

/**
 * Whether biometric unlock is set up, as far as the app knows.
 *
 * Defaults to `true`, since it was required before it became optional. External changes — a
 * re-enrolled fingerprint, a revoked permission — are not reflected here, so a caller still has to
 * handle the key coming back null.
 */
export function getIsBiometricsEnabled() {
  return getSharedMmkv().getBoolean('biometricsEnabled') ?? true
}

export function setIsBiometricsEnabled(isBiometricsEnabled: boolean) {
  getSharedMmkv().set('biometricsEnabled', isBiometricsEnabled)
}
