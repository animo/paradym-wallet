import {
  getRegistrationStatus,
  isSupported,
  type RegisterCredentialsOptions,
  registerCredentials,
  DcApiCredential,
} from '@animo-id/expo-digital-credentials-api'
import { DateOnly, type Logger, type MdocNameSpaces, type MdocRecord, TypedArrayEncoder } from '@credo-ts/core'
import { t } from '@lingui/core/macro'
import { commonMessages, i18n } from '@package/translations'
import { ImageFormat, Skia } from '@shopify/react-native-skia'
import * as ExpoAsset from 'expo-asset'
import { File } from 'expo-file-system'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Platform } from 'react-native'
import { getCredentialForDisplay } from '../display/credential'
import { resolveClaimsWithRecordMetadata, resolveLabelFromClaimsPath } from '../format/attributes'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

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

  return Object.entries(namespaces).flatMap(([namespace, values]) =>
    Object.keys(values).map((key) => ({
      path: [namespace, key],
      displayName: resolveLabelFromClaimsPath([namespace, key], claims, i18n.locale) ?? t(commonMessages.unknown),
    }))
  )
}

function mapSdJwtAttributesToClaimDisplay(
  claims: ReturnType<typeof resolveClaimsWithRecordMetadata>,
  attributes: object,
  path: string[] = []
): CredentialDisplayClaim[] {
  return Object.entries(attributes).flatMap(([claimName, value]) => {
    const nestedClaims =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mapSdJwtAttributesToClaimDisplay(claims, value, [...path, claimName])
        : []

    return [
      {
        path: [...path, claimName],
        displayName: resolveLabelFromClaimsPath([...path, claimName], claims, i18n.locale) ?? t(commonMessages.unknown),
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

async function loadCachedImageAsBase64DataUrl(logger: Logger, url: string) {
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

export type DcApiRegisterCredentialsOptions = {
  paradym: ParadymWalletSdk
  displayTitleFallback: string
  displaySubtitle: (issuerName: string) => string | string
  displaySubtitleFallback: string
}

export async function dcApiRegisterCredentials({
  displayTitleFallback,
  paradym,
  displaySubtitleFallback,
  displaySubtitle,
}: DcApiRegisterCredentialsOptions) {
  try {
    if (!isSupported()) {
      paradym.logger.debug('Skipping Digital Credentials API registration, not supported on this device')
      return
    }

    // On iOS the registrations live in the OS store behind a user permission; registering while the
    // user has denied it throws, and prompting is only useful while it is undecided.
    if (Platform.OS === 'ios') {
      const status = await getRegistrationStatus()
      if (status !== 'authorized' && status !== 'notDetermined') {
        paradym.logger.debug(`Not registering credentials for Digital Credentials API, status is '${status}'`)
        return
      }
    }

    const mdocRecords = await paradym.agent.mdoc.getAll()
    // iOS only matches ISO 18013-7 mdocs, so building the sd-jwt entries would be wasted work.
    const sdJwtVcRecords = Platform.OS === 'ios' ? [] : await paradym.agent.sdJwtVc.getAll()
    const mdocCredentials = mdocRecords.map(async (record): Promise<CredentialItem> => {
      const mdoc = record.firstCredential
      const { display } = getCredentialForDisplay(record)

      const iconDataUrl = display.backgroundImage?.url
        ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.backgroundImage?.url)
        : display.issuer.logo?.url
          ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.issuer.logo.url)
          : undefined

      return {
        id: record.id,
        credential: {
          doctype: mdoc.docType,
          format: 'mso_mdoc',
          namespaces: mapMdocAttributes(mdoc.issuerSignedNamespaces),
        },
        display: {
          title: display.name ?? displayTitleFallback,
          subtitle: display.issuer.name ? displaySubtitle(display.issuer.name) : displaySubtitleFallback,
          claims: mapMdocAttributesToClaimDisplay(mdoc.issuerSignedNamespaces, record),
          iconDataUrl,
        },
        ios: {
          supportedAuthorityKeyIdentifiers: []
        }
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
          claims: mapSdJwtAttributesToClaimDisplay(claims, sdJwtVc.prettyClaims),
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
  } catch (error) {
    // Since this is an experimental feature, and it doedisplayTitleFallbacksn't work if you don't have the latest
    // PlayStore services/Android it could error on some devices. It will only impact the usage
    // of the DC API, so it's okay to swallow the error for now.
    paradym.logger.error('Error registering credentials for DigitalCredentialsAPI', {
      error,
    })
  }
}
