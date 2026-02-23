import {
  type AptitudeConsortiumConfig,
  registerCredentials as registerAptitudeCredentials,
} from '@animo-id/expo-digital-credentials-api-aptitude-consortium'
import {
  encodeIssuanceCreationOptions,
  registerCreationOptions,
} from '@animo-id/expo-digital-credentials-api-cmwallet-issuance'
import { DateOnly, IntegrityVerifier, type Logger, type MdocNameSpaces, type SdJwtVcRecord } from '@credo-ts/core'
import { t } from '@lingui/core/macro'
import { isParadymWallet } from '@easypid/hooks/useFeatureFlag'
import { commonMessages } from '@package/translations'
import { sanitizeString } from '@package/utils'
import { ImageFormat, Skia } from '@shopify/react-native-skia'
import * as ExpoAsset from 'expo-asset'
import { File } from 'expo-file-system'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Platform } from 'react-native'
import type { EitherAgent } from '../agent'
import { getCredentialForDisplay, getCredentialForDisplayId } from '../display'
import { resolveTs12TransactionDisplayMetadata, zScaAttestationExt } from '@animo-id/eudi-wallet-functionality'

type CredentialItem = NonNullable<AptitudeConsortiumConfig['credentials']>[number]
type CredentialField = NonNullable<CredentialItem['fields']>[number]
type ImageDataUrl = `data:image/${'jpg' | 'png'};base64,${string}`

type AptitudeTransactionDataTypes = NonNullable<
  NonNullable<NonNullable<AptitudeConsortiumConfig['credentials']>[number]>['transaction_data_types']
>
type AptitudeTransactionDataTypeConfig = Omit<AptitudeTransactionDataTypes[number], 'schema'>

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

function mapMdocAttributesToFieldConfig(namespaces: MdocNameSpaces): CredentialField[] {
  return Object.entries(namespaces).flatMap(([namespace, values]) =>
    Object.keys(values).map((key) => ({
      path: [namespace, key],
      // FIXME: we need to integrate with claim based mapping of names.
      // For that we first need to:
      //  - use the claims arrays with path syntax in our Wallet instead of the custom mappings
      //  - support oid4vci draft 15 claim syntax
      display_name: sanitizeString(key),
    }))
  )
}

function mapSdJwtAttributesToFieldConfig(claims: object, path: string[] = []): CredentialField[] {
  return Object.entries(claims).flatMap(([claimName, value]) => {
    const nestedClaims =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mapSdJwtAttributesToFieldConfig(value, [...path, claimName])
        : []

    return [
      {
        path: [...path, claimName],
        // FIXME: we need to integrate with claim based mapping of names.
        // For that we first need to:
        //  - use the claims arrays with path syntax in our Wallet instead of the custom mappings
        //  - support oid4vci draft 15 claim syntax
        display_name: sanitizeString(claimName),
      },
      ...nestedClaims,
    ]
  })
}

async function getSdJwtTransactionDataTypes(
  logger: Logger,
  typeMetadata?: unknown
): Promise<AptitudeTransactionDataTypes | undefined> {
  if (!typeMetadata) return undefined

  const parsed = zScaAttestationExt.safeParse(typeMetadata)
  if (!parsed.success) return undefined

  const resolvedEntries = await Promise.all(
    parsed.data.transaction_data_types.map(async (entry) => {
      try {
        const resolved = await resolveTs12TransactionDisplayMetadata(parsed.data, entry.type, entry.subtype, (buf, integrity) =>
          IntegrityVerifier.verifyIntegrity(new Uint8Array(buf), integrity)
        )
        if (!resolved) return undefined

        return {
          type: entry.type,
          subtype: entry.subtype,
          claims: resolved.claims.map((claim) => ({
            path: claim.path,
            display: claim.display.map((label) => ({
              locale: label.locale ?? 'und',
              label: label.name,
              description: undefined,
            })),
          })),
          ui_labels: Object.entries(resolved.ui_labels).map(([key, values]) => ({
            key,
            values: values.map((value) => ({
              locale: value.locale,
              value: value.value,
            })),
          })),
        } satisfies AptitudeTransactionDataTypeConfig
      } catch (error) {
        logger.warn('Error resolving TS12 transaction metadata for DC API registration', { error })
        return undefined
      }
    })
  )

  const filtered = resolvedEntries.filter(
    (entry): entry is AptitudeTransactionDataTypeConfig => entry !== undefined
  )

  return filtered.length > 0 ? (filtered as unknown as AptitudeTransactionDataTypes) : undefined
}

function normalizeAptitudeIcon(iconDataUrl?: string) {
  if (!iconDataUrl) return undefined

  const commaIndex = iconDataUrl.indexOf(',')
  return commaIndex >= 0 ? iconDataUrl.slice(commaIndex + 1) : iconDataUrl
}

function getSdJwtVctValues(record: SdJwtVcRecord) {
  const vctValuesFromChain = record.typeMetadataChain
    ?.map((entry) => entry.vct)
    .filter((vct): vct is string => typeof vct === 'string' && vct.length > 0)

  const tagVct = record.getTags().vct
  const values =
    vctValuesFromChain && vctValuesFromChain.length > 0 ? vctValuesFromChain : tagVct ? [tagVct] : []

  if (values.length === 0) return undefined

  return Array.from(new Set(values))
}

/**
 * Returns base64 data url
 */
async function resizeImageWithAspectRatio(logger: Logger, asset: ExpoAsset.Asset): Promise<ImageDataUrl | undefined> {
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

      const targetSize = 120
      const scale = Math.min(targetSize / svg.width(), targetSize / svg.height()) // Fit inside 120x120
      const surface = Skia.Surface.Make(Math.round(svg.width() * scale), Math.round(svg.height() * scale))
      if (!surface) {
        throw new Error('Unable to rasterize SVG')
      }
      surface.getCanvas().drawSvg(svg, surface.width(), surface.height())
      return `data:image/png;base64,${surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 80)}` as ImageDataUrl
    }

    const image = await Image.loadAsync(asset.localUri)

    // Calculate new dimensions maintaining aspect ratio
    let width: number
    let height: number
    if (image.width >= image.height) {
      // If width is the larger dimension
      const targetSize = 120
      width = targetSize
      height = Math.round((image.height / image.width) * targetSize)
    } else {
      // If height is the larger dimension
      const targetSize = 120
      height = targetSize
      width = Math.round((image.width / image.height) * targetSize)
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

    return `data:image/png;base64,${savedImages.base64}` as ImageDataUrl
  } catch (error) {
    logger.error('Error resizing image.', {
      error,
    })
    throw error
  }
}

async function loadCachedImageAsBase64DataUrl(
  logger: Logger,
  url: string | number
): Promise<ImageDataUrl | undefined> {
  let asset: ExpoAsset.Asset

  try {
    if (typeof url === 'string') {
      if (url.startsWith('data:') || url.startsWith('data://')) {
        const normalized = url.replace(/^data:\/\//, 'data:')
        if (normalized.startsWith('data:image/jpeg;base64,')) {
          return `data:image/jpg;base64,${normalized.slice('data:image/jpeg;base64,'.length)}` as ImageDataUrl
        }
        if (/^data:image\/(png|jpg);base64,/i.test(normalized)) {
          return normalized as ImageDataUrl
        }
        return undefined
      }

      // in case of external image
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const cachePath = await Image.getCachePathAsync(url)
        if (!cachePath) return undefined

        asset = await ExpoAsset.Asset.fromURI(`file://${cachePath}`).downloadAsync()
        return await resizeImageWithAspectRatio(logger, asset)
      }

      if (url.startsWith('file://')) {
        asset = await ExpoAsset.Asset.fromURI(url).downloadAsync()
        return await resizeImageWithAspectRatio(logger, asset)
      }
    }

    // In case of local image
    asset = ExpoAsset.Asset.fromModule(url)
    return await resizeImageWithAspectRatio(logger, asset)
  } catch (error) {
    // just ignore it, we don't want to cause issues with registering crednetials
    logger.error('Error resizing and retrieving cached image for DC API', {
      error,
    })
  }
}

export async function registerCredentialsForDcApi(agent: EitherAgent) {
  if (Platform.OS === 'ios') return

  try {
    const mdocRecords = await agent.mdoc.getAll()
    const sdJwtVcRecords = await agent.sdJwtVc.getAll()
    const mdocCredentials = mdocRecords.map(async (record): Promise<CredentialItem> => {
      const mdoc = record.firstCredential
      const { display } = getCredentialForDisplay(record)

      const iconDataUrl = display.backgroundImage?.url
        ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.backgroundImage?.url)
        : display.issuer.logo?.url
          ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.issuer.logo.url)
          : undefined

      return {
        id: getCredentialForDisplayId(record),
        format: 'mso_mdoc',
        title: display.name,
        subtitle: t(commonMessages.issuedByWithName(display.issuer.name)),
        fields: mapMdocAttributesToFieldConfig(mdoc.issuerSignedNamespaces),
        icon: normalizeAptitudeIcon(iconDataUrl),
        doctype: mdoc.docType,
        claims: mapMdocAttributes(mdoc.issuerSignedNamespaces),
      } as const
    })

    const sdJwtCredentials = sdJwtVcRecords.map(async (record): Promise<CredentialItem> => {
      const sdJwtVc = record.firstCredential
      const { display } = getCredentialForDisplay(record)

      const iconDataUrl = display.backgroundImage?.url
        ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.backgroundImage?.url)
        : display.issuer.logo?.url
          ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.issuer.logo.url)
          : undefined

      const transactionDataTypes = await getSdJwtTransactionDataTypes(agent.config.logger, record.typeMetadata)

      return {
        id: getCredentialForDisplayId(record),
        format: 'dc+sd-jwt',
        title: display.name,
        subtitle: t(commonMessages.issuedByWithName(display.issuer.name)),
        fields: mapSdJwtAttributesToFieldConfig(sdJwtVc.prettyClaims),
        icon: normalizeAptitudeIcon(iconDataUrl),
        vcts: getSdJwtVctValues(record),
        transaction_data_types: transactionDataTypes,
        // biome-ignore lint/suspicious/noExplicitAny: no explanation
        claims: sdJwtVc.prettyClaims as any,
      } as const
    })

    const credentials = await Promise.all([...sdJwtCredentials, ...mdocCredentials])
    agent.config.logger.trace('Registering credentials for Digital Credentials API')

    const aptitudeConfig: AptitudeConsortiumConfig = {
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
    }

    await registerAptitudeCredentials({
      aptitudeConsortiumConfig: aptitudeConfig,
    })
  } catch (error) {
    // Since this is an experimental feature, and it doesn't work if you don't have the latest
    // PlayStore services/Android it could error on some devices. It will only impact the usage
    // of the DC API, so it's okay to swallow the error for now.
    agent.config.logger.error('Error registering credentials for DigitalCredentialsAPI', {
      error,
    })
  }
}

const fallbackLogger: Logger = {
  trace: console.debug,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  fatal: console.error,
}

export async function registerCreationOptionsForDcApi(agent?: EitherAgent) {
  if (Platform.OS === 'ios') return

  try {
    const logger = agent?.config.logger ?? fallbackLogger
    const iconAsset = isParadymWallet()
      ? require('../../../../apps/easypid/assets/paradym/icon.png')
      : require('../../../../apps/easypid/assets/funke/icon.png')

    const iconDataUrl = await loadCachedImageAsBase64DataUrl(logger, iconAsset)

    const creationOptions = encodeIssuanceCreationOptions({
      display: {
        title: isParadymWallet() ? 'Paradym Wallet' : 'Funke Wallet',
        subtitle: 'Save your credential to your wallet',
        iconDataUrl,
      },
    })

    await registerCreationOptions({
      creationOptions,
    })
  } catch (error) {
    const logger = agent?.config.logger ?? fallbackLogger
    logger.error('Error registering creation options for DigitalCredentialsAPI', {
      error,
    })
  }
}
