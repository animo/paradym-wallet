import {
  type AptitudeConsortiumConfig,
  registerCredentials,
} from '@animo-id/expo-digital-credentials-api-aptitude-consortium'
import { DateOnly, type Logger, type MdocNameSpaces, type MdocRecord, type SdJwtVcRecord } from '@credo-ts/core'
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

type CredentialItem = NonNullable<AptitudeConsortiumConfig['credentials']>[number]
type CredentialDisplayClaim = NonNullable<CredentialItem['fields']>[number]
const noTransactionDataTypes: NonNullable<CredentialItem['transaction_data_types']> = []

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
      display_name: resolveLabelFromClaimsPath([namespace, key], claims, i18n.locale) ?? t(commonMessages.unknown),
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
        display_name:
          resolveLabelFromClaimsPath([...path, claimName], claims, i18n.locale) ?? t(commonMessages.unknown),
      },
      ...nestedClaims,
    ]
  })
}

function normalizeAptitudeIcon(iconDataUrl?: string) {
  if (!iconDataUrl) return undefined

  const commaIndex = iconDataUrl.indexOf(',')
  return commaIndex >= 0 ? iconDataUrl.slice(commaIndex + 1) : iconDataUrl
}

function getSdJwtVcts(record: SdJwtVcRecord) {
  const chainVcts = record.typeMetadataChain
    ?.map((entry) => entry.vct)
    .filter((vct): vct is string => typeof vct === 'string' && vct.length > 0)

  const tagVct = record.getTags().vct
  const vcts = chainVcts && chainVcts.length > 0 ? chainVcts : tagVct ? [tagVct] : []

  return vcts.length > 0 ? Array.from(new Set(vcts)) : undefined
}

/**
 * Returns base64 data url
 */
async function resizeImageWithAspectRatio(logger: Logger, asset: ExpoAsset.Asset) {
  try {
    // Make sure the asset is loaded
    if (!asset.localUri) {
      await asset.downloadAsync()
    }

    if (!asset.localUri) {
      return undefined
    }

    const file = new File(asset.localUri)
    const handle = file.open()
    let header: string = ''
    try {
      const first50Bytes = handle.readBytes(50) // Returns Uint8Array
      header = new TextDecoder().decode(first50Bytes)
    } finally {
      handle.close()
    }
    if (header.startsWith('<?xml') || header.startsWith('<svg')) {
      const svg = Skia.SVG.MakeFromString(await file.text())
      if (!svg) return undefined

      const scale = Math.min(20 / svg.width(), 20 / svg.height()) // Fit inside 20x20
      const surface = Skia.Surface.Make(Math.round(svg.width() * scale), Math.round(svg.height() * scale))
      if (!surface) {
        throw new Error('Unable to rasterize SVG')
      }
      surface.getCanvas().drawSvg(svg, surface.width(), surface.height())
      return `data:image/png;base64,${surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 80)}` as const
    }

    const image = await Image.loadAsync(asset.localUri)

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

    // Use the new API to resize the image
    const resizedImage = await ImageManipulator.manipulate(image).resize({ width, height }).renderAsync()
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

async function loadCachedImageAsBase64DataUrl(logger: Logger, url: string) {
  let asset: ExpoAsset.Asset

  try {
    // in case of external image
    if (url.startsWith('data://') || url.startsWith('https://')) {
      const cachePath = await Image.getCachePathAsync(url)
      if (!cachePath) return undefined

      asset = await ExpoAsset.Asset.fromURI(`file://${cachePath}`).downloadAsync()
    }
    // In case of local image
    else {
      asset = ExpoAsset.Asset.fromModule(url)
    }

    return await resizeImageWithAspectRatio(logger, asset)
  } catch (error) {
    // just ignore it, we don't want to cause issues with registering crednetials
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
  if (Platform.OS === 'ios') return

  try {
    const mdocRecords = await paradym.agent.mdoc.getAll()
    const sdJwtVcRecords = await paradym.agent.sdJwtVc.getAll()

    const mdocCredentials = mdocRecords.map(async (record): Promise<CredentialItem> => {
      const mdoc = record.firstCredential
      const { display } = getCredentialForDisplay(record)

      const iconDataUrl = display.backgroundImage?.url
        ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.backgroundImage?.url)
        : display.issuer.logo?.url
          ? await loadCachedImageAsBase64DataUrl(paradym.logger, display.issuer.logo.url)
          : undefined

      return {
        id: getCredentialForDisplay(record).id,
        format: 'mso_mdoc',
        title: display.name ?? displayTitleFallback,
        subtitle: display.issuer.name ? displaySubtitle(display.issuer.name) : displaySubtitleFallback,
        fields: mapMdocAttributesToClaimDisplay(mdoc.issuerSignedNamespaces, record),
        icon: normalizeAptitudeIcon(iconDataUrl),
        doctype: mdoc.docType,
        transaction_data_types: noTransactionDataTypes,
        claims: mapMdocAttributes(mdoc.issuerSignedNamespaces),
      } as const
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
        id: getCredentialForDisplay(record).id,
        format: 'dc+sd-jwt',
        title: display.name ?? displayTitleFallback,
        subtitle: display.issuer.name ? displaySubtitle(display.issuer.name) : displaySubtitleFallback,
        fields: mapSdJwtAttributesToClaimDisplay(claims, sdJwtVc.prettyClaims),
        icon: normalizeAptitudeIcon(iconDataUrl),
        vcts: getSdJwtVcts(record),
        transaction_data_types: noTransactionDataTypes,
        // biome-ignore lint/suspicious/noExplicitAny: no explanation
        claims: sdJwtVc.prettyClaims as any,
      } as const
    })

    const credentials = await Promise.all([...sdJwtCredentials, ...mdocCredentials])
    paradym.logger.trace('Registering credentials for Digital Credentials API')

    await registerCredentials({
      aptitudeConsortiumConfig: {
        openid4vp: {
          enabled: true,
          allow_dcql: true,
          allow_transaction_data: true,
          allow_signed_requests: true,
          allow_response_mode_jwt: true,
        },
        log_level: __DEV__ ? 'debug' : undefined,
        dcql: {
          credential_set_option_mode: 'all_satisfiable',
          optional_credential_sets_mode: 'prefer_present',
        },
        credentials,
      },
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
