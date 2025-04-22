import { type RegisterCredentialsOptions, registerCredentials } from '@animo-id/expo-digital-credentials-api'
import { DateOnly, type MdocNameSpaces } from '@credo-ts/core'
import { sanitizeString } from '@package/utils'
import * as ExpoAsset from 'expo-asset'
import * as FileSystem from 'expo-file-system'
import { Image } from 'expo-image'
import { Platform } from 'react-native'
import type { EitherAgent } from '../agent'
import { getCredentialForDisplay } from '../display'

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

function mapMdocAttributesToClaimDisplay(namespaces: MdocNameSpaces) {
  return Object.entries(namespaces).flatMap(([namespace, values]) =>
    Object.keys(values).map((key) => ({
      path: [namespace, key],
      // FIXME: we need to integrate with claim based mapping of names.
      // For that we first need to:
      //  - use the claims arrays with path syntax in our Wallet instead of the custom mappings
      //  - support oid4vci draft 15 claim syntax
      displayName: sanitizeString(key),
    }))
  )
}

function mapSdJwtAttributesToClaimDisplay(claims: object, path: string[] = []): CredentialDisplayClaim[] {
  return Object.entries(claims).flatMap(([claimName, value]) => {
    const nestedClaims =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mapSdJwtAttributesToClaimDisplay(value, [...path, claimName])
        : []

    return [
      {
        path: [...path, claimName],
        // FIXME: we need to integrate with claim based mapping of names.
        // For that we first need to:
        //  - use the claims arrays with path syntax in our Wallet instead of the custom mappings
        //  - support oid4vci draft 15 claim syntax
        displayName: sanitizeString(claimName),
      },
      ...nestedClaims,
    ]
  })
}

async function loadCachedImageAsBase64DataUrl(url: string) {
  const path =
    // in case of external iamge
    url.startsWith('data://') || url.startsWith('https://')
      ? await Image.getCachePathAsync(url)
      : // In case of local image
        (await ExpoAsset.Asset.fromModule(url).downloadAsync()).localUri

  if (!path) return undefined
  const content = await FileSystem.readAsStringAsync(path.startsWith('file://') ? path : `file://${path}`, {
    encoding: 'base64',
  }).catch(() => null)

  if (!content) return undefined

  return `data:image/png;base64,${content}` as const
}

export async function registerCredentialsForDcApi(agent: EitherAgent) {
  if (Platform.OS === 'ios') return

  const mdocRecords = await agent.mdoc.getAll()
  const sdJwtVcRecords = await agent.sdJwtVc.getAll()

  const mdocCredentials = mdocRecords.map(async (record): Promise<CredentialItem> => {
    const mdoc = record.credential
    const { display } = getCredentialForDisplay(record)

    const iconDataUrl = display.backgroundImage?.url
      ? await loadCachedImageAsBase64DataUrl(display.backgroundImage?.url)
      : display.issuer.logo?.url
        ? await loadCachedImageAsBase64DataUrl(display.issuer.logo.url)
        : undefined

    return {
      id: record.id,
      credential: {
        doctype: mdoc.docType,
        format: 'mso_mdoc',
        namespaces: mapMdocAttributes(mdoc.issuerSignedNamespaces),
      },
      display: {
        title: display.name,
        subtitle: `Issued by ${display.issuer.name}`,
        claims: mapMdocAttributesToClaimDisplay(mdoc.issuerSignedNamespaces),
        iconDataUrl,
      },
    } as const
  })

  const sdJwtCredentials = sdJwtVcRecords.map(async (record): Promise<CredentialItem> => {
    const sdJwtVc = record.credential
    const { display } = getCredentialForDisplay(record)

    const iconDataUrl = display.backgroundImage?.url
      ? await loadCachedImageAsBase64DataUrl(display.backgroundImage?.url)
      : display.issuer.logo?.url
        ? await loadCachedImageAsBase64DataUrl(display.issuer.logo.url)
        : undefined

    return {
      id: record.id,
      credential: {
        vct: record.getTags().vct,
        format: 'dc+sd-jwt',
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        claims: sdJwtVc.prettyClaims as any,
      },
      display: {
        title: display.name,
        subtitle: `Issued by ${display.issuer.name}`,
        claims: mapSdJwtAttributesToClaimDisplay(sdJwtVc.prettyClaims),
        iconDataUrl,
      },
    } as const
  })

  const credentials = await Promise.all([...sdJwtCredentials, ...mdocCredentials])
  agent.config.logger.trace('Registering credentials for Digital Credentials API', {
    credentials,
  })

  await registerCredentials({
    credentials,
    matcher: 'ubique',
  })
}
