import {
  type DcApiCredential,
  DcApiUnsupportedError,
  getRegistrationStatus,
  isSupported,
  type RegisterCredentialsOptions,
  registerCredential,
  registerCredentials,
  removeCredential,
} from '@animo-id/expo-digital-credentials-api'
import {
  DateOnly,
  type Logger,
  type MdocNameSpaces,
  MdocRecord,
  type SdJwtVcRecord,
  TypedArrayEncoder,
} from '@credo-ts/core'
import { ImageFormat, Skia } from '@shopify/react-native-skia'
import * as ExpoAsset from 'expo-asset'
import { File } from 'expo-file-system'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Platform } from 'react-native'
import type { AttributeLabelCredentialContext } from '../config/attributeLabel'
import { getDcApiDisplay, type ResolveDcApiDisplay } from '../config/dcApiDisplay'
import { getLocale } from '../config/locale'
import type { CredentialForDisplayId } from '../display/credential'
import { getCredentialForDisplay } from '../display/credential'
import {
  getAttributeLabelContextForRecord,
  resolveAttributeLabelForPath,
  resolveClaimsWithRecordMetadata,
} from '../format/attributes'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import type { CredentialRecord } from '../storage/credentials'
import { getSharedMmkv } from '../storage/sharedMmkv'

type CredentialItem = RegisterCredentialsOptions['credentials'][number]
type CredentialDisplayClaim = NonNullable<CredentialItem['display']['claims']>[number]

function mapMdocAttributes(namespaces: MdocNameSpaces) {
  return Object.fromEntries(
    Object.entries(namespaces).map(([namespace, values]) => [
      namespace,
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
            return [key, value]
          }

          if (value instanceof Date || value instanceof DateOnly) {
            return [key, value.toISOString()]
          }

          // For all other complex types we don't allow matching based on the value
          return [key, null]
        })
      ),
    ])
  )
}

function mapMdocAttributesToClaimDisplay(namespaces: MdocNameSpaces, record: MdocRecord) {
  const claims = resolveClaimsWithRecordMetadata(record)
  const credentialContext = getAttributeLabelContextForRecord(record)

  return Object.entries(namespaces).flatMap(([namespace, values]) =>
    Object.keys(values).map((key) => ({
      path: [namespace, key],
      displayName: resolveAttributeLabelForPath({ path: [namespace, key], key, claims, credentialContext }),
    }))
  )
}

function mapSdJwtAttributesToClaimDisplay(
  claims: ReturnType<typeof resolveClaimsWithRecordMetadata>,
  credentialContext: AttributeLabelCredentialContext,
  attributes: object,
  path: string[] = []
): CredentialDisplayClaim[] {
  return Object.entries(attributes).flatMap(([claimName, value]) => {
    const nestedClaims =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mapSdJwtAttributesToClaimDisplay(claims, credentialContext, value, [...path, claimName])
        : []

    const claimPath = [...path, claimName]

    return [
      {
        path: claimPath,
        displayName: resolveAttributeLabelForPath({ path: claimPath, key: claimName, claims, credentialContext }),
      },
      ...nestedClaims,
    ]
  })
}

/**
 * The svg source behind a uri, or `undefined` when it does not point at one.
 *
 * Sniffed by content rather than by extension, the way the wallet receives these: a display uri
 * carries no filename to go on.
 */
async function readSvgSource(uri: string): Promise<string | undefined> {
  if (uri.startsWith('data:')) {
    if (!uri.startsWith('data:image/svg+xml')) return undefined

    const [metadata, data] = splitDataUrl(uri)
    if (data === undefined) return undefined

    return metadata.includes(';base64')
      ? new TextDecoder().decode(TypedArrayEncoder.fromBase64(data))
      : decodeURIComponent(data)
  }

  const file = new File(uri)
  const handle = file.open()
  try {
    const header = new TextDecoder().decode(handle.readBytes(50))
    if (!header.startsWith('<?xml') && !header.startsWith('<svg')) return undefined
  } finally {
    handle.close()
  }

  return await file.text()
}

function splitDataUrl(url: string): [metadata: string, data?: string] {
  const separator = url.indexOf(',')
  if (separator === -1) return [url]

  return [url.slice(0, separator), url.slice(separator + 1)]
}

/**
 * Returns base64 data url
 */
async function resizeImageWithAspectRatio(logger: Logger, uri: string) {
  try {
    const svgSource = await readSvgSource(uri)
    if (svgSource !== undefined) {
      const svg = Skia.SVG.MakeFromString(svgSource)
      if (!svg) return undefined

      const scale = Math.min(20 / svg.width(), 20 / svg.height()) // Fit inside 20x20
      const surface = Skia.Surface.Make(Math.round(svg.width() * scale), Math.round(svg.height() * scale))
      if (!surface) {
        throw new Error('Unable to rasterize SVG')
      }
      surface.getCanvas().drawSvg(svg, surface.width(), surface.height())
      return `data:image/png;base64,${surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 80)}` as const
    }

    const image = await Image.loadAsync(uri)

    // Calculate new dimensions maintaining aspect ratio
    let width: number
    let height: number
    if (image.width >= image.height) {
      // If width is the larger dimension
      width = 20
      height = Math.round((image.height / image.width) * 20)
    } else {
      // If height is the larger dimension
      height = 20
      width = Math.round((image.width / image.height) * 20)
    }

    // Only the dimensions were needed, and holding a full-size decoded bitmap until GC is wasteful
    // when this runs once per credential.
    image.release()

    // The uri, never the `ImageRef`: `manipulate` takes an `Either<URL, SharedRef<UIImage>>`, and
    // `Either` tries `URL` first — which converts the argument with `getAny()`, walking the object's
    // properties. On a shared ref that reaches `release`, and `getAny()` on a function is a Swift
    // `fatalError` the surrounding `try?` cannot catch, so the app dies before the `SharedRef`
    // branch is ever tried.
    const resizedImage = await ImageManipulator.manipulate(uri).resize({ width, height }).renderAsync()
    const savedImages = await resizedImage.saveAsync({
      base64: true,
      format: SaveFormat.PNG,
      compress: 1,
    })

    if (!savedImages.base64) {
      return undefined
    }

    return `data:image/png;base64,${savedImages.base64}` as const
  } catch (error) {
    logger.error('Error resizing image.', {
      error,
    })
    throw error
  }
}

/**
 * A uri the image can be read from, for each of the three shapes a display image arrives in.
 */
async function resolveImageUri(url: string): Promise<string | undefined> {
  // Already inline: there is nothing to fetch, and nothing caches it either.
  if (url.startsWith('data:')) return url

  // Remote, so only usable once the wallet has already displayed it and expo-image cached it.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const cachePath = await Image.getCachePathAsync(url)
    return cachePath ? `file://${cachePath}` : undefined
  }

  // A bundled asset, handed over as the `require`d module rather than as a url.
  const asset = await ExpoAsset.Asset.fromModule(url).downloadAsync()
  return asset.localUri ?? undefined
}

/**
 * Rasterized icons, keyed by the display url they were built from.
 *
 * Rasterizing is the expensive half of a registration — decoding the image, resizing it and
 * base64-encoding the result, once per credential — and the wallet re-registers its whole set on
 * every store, update and delete. Issuers hand out the same logo to every credential they issue, so
 * without this the same icon is rebuilt several times within a single registration.
 */
const iconDataUrlCache = new Map<string, CredentialItem['display']['iconDataUrl']>()

async function loadCachedImageAsBase64DataUrl(logger: Logger, url: string) {
  if (iconDataUrlCache.has(url)) return iconDataUrlCache.get(url)

  const iconDataUrl = await buildCachedImageAsBase64DataUrl(logger, url)
  // Also cached when it could not be built: a remote image expo-image has not cached yet stays
  // unresolvable until it is displayed, and retrying it on every registration never helped.
  iconDataUrlCache.set(url, iconDataUrl)

  return iconDataUrl
}

async function buildCachedImageAsBase64DataUrl(logger: Logger, url: string) {
  try {
    const uri = await resolveImageUri(url)
    if (!uri) return undefined

    return await resizeImageWithAspectRatio(logger, uri)
  } catch (error) {
    // just ignore it, we don't want to cause issues with registering credentials
    logger.error('Error resizing and retrieving cached image for DC API', {
      error,
    })
  }
}

/**
 * Whether the platform will accept registrations at all right now.
 */
async function canRegisterCredentials(paradym: ParadymWalletSdk): Promise<string | undefined> {
  if (!isSupported()) {
    paradym.logger.debug('Skipping Digital Credentials API registration, not supported on this device')
    return undefined
  }

  // On iOS the registrations live in the OS store behind a user permission; registering while the
  // user has denied it throws, and prompting is only useful while it is undecided.
  if (Platform.OS === 'ios') {
    const status = await getRegistrationStatus()
    if (status !== 'authorized' && status !== 'notDetermined') {
      paradym.logger.debug(`Not registering credentials for Digital Credentials API, status is '${status}'`)
      return undefined
    }

    return status
  }

  return 'authorized'
}

export type DcApiRegisterCredentialsOptions = {
  paradym: ParadymWalletSdk

  /**
   * What the picker shows. Optional: without them the wallet's configured
   * {@link import('../config/dcApiDisplay').ResolveDcApiDisplay} is asked instead, which is how the
   * SDK's own flows register a credential without the app in the middle.
   */
  displayTitleFallback?: string
  displaySubtitle?: (issuerName: string) => string | string
  displaySubtitleFallback?: string

  /**
   *
   * Records to register, when the caller already holds them. The record providers have read every
   * credential by the time the wallet registers at startup, and reading them again here is a second
   * pass over the same rows and a second decode of the same credentials.
   *
   * Omitted, they are read from the store.
   *
   */
  records?: { mdoc: MdocRecord[]; sdJwtVc: SdJwtVcRecord[] }
}

/**
 * The key under which the last registered fingerprint is stored.
 */
const registrationFingerprintKey = 'dcApiRegistrationFingerprint'

/**
 * What the registered set is derived from, so an unchanged set can skip the work of rebuilding it.
 *
 * Records rather than the built registrations, because the point is to decide before building them:
 * on Android that means decoding every credential and rasterizing an icon each, and on iOS it means
 * tearing the OS store down and adding every document back.
 *
 * The registration status is part of it because a wallet that could not register before — the user
 * had not answered the permission prompt yet — has to register once it can, with the same records.
 *
 * The locale is part of it on Android because the claim labels registered there are resolved in the
 * current locale, so switching language has to register them again. iOS registers no labels.
 *
 * Nothing here can read the OS store back, so this describes what the wallet believes is registered
 * rather than what is: an install restored from a backup could bring this fingerprint back without
 * the registrations it describes, and would then not re-register until its credentials next change.
 */
function getRegistrationFingerprint(
  records: Array<{ id: string; createdAt: Date; updatedAt?: Date }>,
  registrationStatus: string
) {
  const entries = records
    .map((record) =>
      // iOS registers the document identifier and its type, and neither can change for a record
      // that already exists — so an update to one is not a change to what is registered. Android
      // encodes display and claims too, which an update can change.
      Platform.OS === 'ios' ? record.id : `${record.id}:${(record.updatedAt ?? record.createdAt).getTime()}`
    )
    .sort()
    .join(',')

  return Platform.OS === 'ios' ? `${registrationStatus}|${entries}` : `${registrationStatus}|${getLocale()}|${entries}`
}

export async function dcApiRegisterCredentials(options: DcApiRegisterCredentialsOptions) {
  const { paradym, records } = options
  const { displayTitleFallback, displaySubtitle, displaySubtitleFallback } = withConfiguredDisplay(options)

  try {
    const registrationStatus = await canRegisterCredentials(paradym)
    if (!registrationStatus) return

    const mdocRecords = records?.mdoc ?? (await paradym.agent.mdoc.getAll())
    // iOS only matches ISO 18013-7 mdocs, so building the sd-jwt entries would be wasted work.
    const sdJwtVcRecords = Platform.OS === 'ios' ? [] : (records?.sdJwtVc ?? (await paradym.agent.sdJwtVc.getAll()))

    // Reading the records is cheap; everything after this is not. Registering an unchanged set
    // rebuilds it for no reason, and the wallet did that on every unlock.
    const fingerprint = getRegistrationFingerprint([...mdocRecords, ...sdJwtVcRecords], registrationStatus)
    if (getSharedMmkv().getString(registrationFingerprintKey) === fingerprint) {
      paradym.logger.debug('Registered credentials for Digital Credentials API are unchanged, skipping')
      return
    }
    const mdocCredentials = mdocRecords.map(async (record): Promise<CredentialItem> => {
      const mdoc = record.firstCredential

      // iOS registers the document identifier and type and nothing else — `registerCredentials`
      // drops namespaces, display and claims there, because the OS does the matching itself and
      // only knows those. Building them anyway would decode the credential, walk its whole claim
      // tree and rasterize an icon per credential, all on the unlock path, for data thrown away.
      if (Platform.OS === 'ios') {
        return {
          id: record.id,
          credential: {
            doctype: mdoc.docType,
            format: 'mso_mdoc',
            namespaces: {},
          },
          display: {
            title: displayTitleFallback,
            subtitle: displaySubtitleFallback,
          },
          ios: {
            supportedAuthorityKeyIdentifiers: [],
          },
        } as const satisfies DcApiCredential
      }

      const { display } = getCredentialForDisplay(record)

      const iconDataUrl = display.backgroundImage?.url
        ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.backgroundImage?.url)
        : display.issuer.logo?.url
          ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.issuer.logo.url)
          : undefined

      // A getter that rebuilds the namespace objects on every access, and both mappings below walk
      // all of them.
      const issuerSignedNamespaces = mdoc.issuerSignedNamespaces

      return {
        id: record.id,
        credential: {
          doctype: mdoc.docType,
          format: 'mso_mdoc',
          namespaces: mapMdocAttributes(issuerSignedNamespaces),
        },
        display: {
          title: display.name ?? displayTitleFallback,
          subtitle: display.issuer.name ? displaySubtitle(display.issuer.name) : displaySubtitleFallback,
          claims: mapMdocAttributesToClaimDisplay(issuerSignedNamespaces, record),
          iconDataUrl,
        },
        ios: {
          supportedAuthorityKeyIdentifiers: [],
        },
      } as const satisfies DcApiCredential
    })

    const sdJwtCredentials = sdJwtVcRecords.map(async (record): Promise<CredentialItem> => {
      const sdJwtVc = record.firstCredential
      const { display } = getCredentialForDisplay(record)

      const iconDataUrl = display.backgroundImage?.url
        ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.backgroundImage?.url)
        : display.issuer.logo?.url
          ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.issuer.logo.url)
          : undefined

      const claims = resolveClaimsWithRecordMetadata(record)

      return {
        id: record.id,
        credential: {
          vct: record.getTags().vct,
          format: 'dc+sd-jwt',
          // biome-ignore lint/suspicious/noExplicitAny: no explanation
          claims: sdJwtVc.prettyClaims as any,
        },
        display: {
          title: display.name ?? displayTitleFallback,
          subtitle: display.issuer.name ? displaySubtitle(display.issuer.name) : displaySubtitleFallback,
          // The disclosed claims, not the storage record — walking the record would register its
          // own fields (`id`, `createdAt`, `_tags`, …) as the credential's claim display metadata.
          claims: mapSdJwtAttributesToClaimDisplay(
            claims,
            getAttributeLabelContextForRecord(record),
            sdJwtVc.prettyClaims
          ),
          iconDataUrl,
        },
      } as const satisfies DcApiCredential
    })

    const credentials = await Promise.all([...sdJwtCredentials, ...mdocCredentials])
    paradym.logger.trace('Registering credentials for Digital Credentials API')

    await registerCredentials({
      credentials,
      // Multipaz is the only matcher that can answer org-iso-mdoc, which is what the request UI
      // builds an Annex C response for on both platforms.
      android: { matcher: 'multipaz' },
    })

    getSharedMmkv().set(registrationFingerprintKey, fingerprint)
  } catch (error) {
    // Since this is an experimental feature, and it doesn't work if you don't have the latest
    // PlayStore services/Android it could error on some devices. It will only impact the usage
    // of the DC API, so it's okay to swallow the error for now.
    paradym.logger.error('Error registering credentials for DigitalCredentialsAPI', {
      error,
    })
  }
}

/**
 * Drop the stored fingerprint after a single-credential change.
 *
 * The OS store is already correct — this only costs the next startup one full re-registration,
 * which then records a fresh fingerprint. Recomputing it here would mean reading every record back
 * just to describe a set that is already registered.
 */
function invalidateRegistrationFingerprint() {
  getSharedMmkv().remove(registrationFingerprintKey)
}

/**
 * Register one newly stored credential.
 *
 * iOS keeps the registered set itself and takes documents one at a time, so a new credential is
 * added rather than triggering a rebuild: `registerDocuments` removes every registration and adds
 * them all back, which is what made storing a credential slow once the wallet held a few. Android
 * replaces the whole registry in one call, so there a single credential still means re-registering
 * everything.
 */
/** The caller's display strings, with whatever it left out taken from configuration. */
function withConfiguredDisplay(options: Partial<ReturnType<ResolveDcApiDisplay>>) {
  const configured = getDcApiDisplay()

  return {
    displayTitleFallback: options.displayTitleFallback ?? configured.displayTitleFallback,
    displaySubtitle: options.displaySubtitle ?? configured.displaySubtitle,
    displaySubtitleFallback: options.displaySubtitleFallback ?? configured.displaySubtitleFallback,
  }
}

export async function dcApiAddCredential(
  options: DcApiRegisterCredentialsOptions & { credentialRecord: CredentialRecord }
) {
  const { paradym, credentialRecord } = options

  if (Platform.OS !== 'ios') return dcApiRegisterCredentials(options)

  try {
    if (!(await canRegisterCredentials(paradym))) return

    // iOS only matches ISO 18013-7 mdocs; nothing else was ever registered, so nothing else has to
    // be added.
    if (!(credentialRecord instanceof MdocRecord)) return

    await registerCredential({
      credential: {
        id: credentialRecord.id,
        credential: {
          doctype: credentialRecord.firstCredential.docType,
          format: 'mso_mdoc',
          namespaces: {},
        },
        display: {
          title: withConfiguredDisplay(options).displayTitleFallback,
          subtitle: withConfiguredDisplay(options).displaySubtitleFallback,
        },
        ios: {
          supportedAuthorityKeyIdentifiers: [],
        },
      },
    })

    invalidateRegistrationFingerprint()
  } catch (error) {
    // Unlike the bulk call, `registerCredential` rejects a document type this build is not entitled
    // to instead of skipping it. That is not an error here: the wallet stores what it is given.
    if (error instanceof DcApiUnsupportedError) {
      paradym.logger.debug('Credential cannot be registered for the Digital Credentials API', { error })
      return
    }

    paradym.logger.error('Error registering credential for DigitalCredentialsAPI', { error })
  }
}

/**
 * Remove one deleted credential from the registered set.
 *
 * iOS removes the single document, for the same reason {@link dcApiAddCredential} adds one. Android
 * re-registers what is left.
 */
export async function dcApiRemoveCredential(
  options: DcApiRegisterCredentialsOptions & { credentialId: CredentialForDisplayId }
) {
  const { paradym, credentialId } = options

  if (Platform.OS !== 'ios') return dcApiRegisterCredentials(options)

  try {
    if (!(await canRegisterCredentials(paradym))) return

    // Only mdocs are registered on iOS, and registrations are keyed by the record id rather than
    // the prefixed display id.
    if (!credentialId.startsWith('mdoc-')) return

    await removeCredential(credentialId.replace('mdoc-', ''))

    invalidateRegistrationFingerprint()
  } catch (error) {
    paradym.logger.error('Error removing credential for DigitalCredentialsAPI', { error })
  }
}
