import {
  type DigitalCredentialsRequest,
  type RegisterCredentialsOptions,
  registerCredentials,
  sendErrorResponse,
  sendResponse,
} from '@animo-id/expo-digital-credentials-api'
import { DateOnly, type Logger, type MdocNameSpaces } from '@credo-ts/core'
import * as ExpoAsset from 'expo-asset'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Platform } from 'react-native'
import type { BaseAgent, OpenId4VcAgent } from '../agent'
import { getCredentialForDisplay } from '../display/credential'
import { sanitizeString } from '../display/strings'
import { shareProof } from '../invitation/shareProof'
import { getHostNameFromUrl } from '../utils/url'
import type { FetchBatchCredentialCallback } from './batch'
import { type CredentialsForProofRequest, getCredentialsForProofRequest } from './getCredentialsForProofRequest'

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

export async function registerCredentialsForDcApi(agent: BaseAgent) {
  if (Platform.OS === 'ios') return

  const mdocRecords = await agent.mdoc.getAll()
  const sdJwtVcRecords = await agent.sdJwtVc.getAll()

  const mdocCredentials = mdocRecords.map(async (record): Promise<CredentialItem> => {
    const mdoc = record.credential
    const { display } = getCredentialForDisplay(record)

    const iconDataUrl = display.backgroundImage?.url
      ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.backgroundImage?.url)
      : display.issuer.logo?.url
        ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.issuer.logo.url)
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
      ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.backgroundImage?.url)
      : display.issuer.logo?.url
        ? await loadCachedImageAsBase64DataUrl(agent.config.logger, display.issuer.logo.url)
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
  agent.config.logger.trace('Registering credentials for Digital Credentials API')

  await registerCredentials({
    credentials,
    matcher: 'ubique',
  })
}

export async function resolveRequestForDcApi({
  agent,
  request,
}: { agent: OpenId4VcAgent; request: DigitalCredentialsRequest }) {
  const providerRequest = request.request.requests
    ? request.request.requests[request.selectedEntry.providerIndex].data
    : request.request.providers[request.selectedEntry.providerIndex].request

  const authorizationRequestPayload =
    typeof providerRequest === 'string' ? JSON.parse(providerRequest) : providerRequest

  // TODO: should allow limiting it to a specific credential (as we already know the credential id)
  const result = await getCredentialsForProofRequest({
    agent,
    requestPayload: authorizationRequestPayload,
    origin: request.origin,
  })

  if (result.formattedSubmission.entries.length !== 1) {
    throw new Error('Only requests for a single credential supported for digital credentials api')
  }

  agent.config.logger.debug('Resolved request', {
    result,
  })
  if (result.formattedSubmission.entries[0].isSatisfied) {
    const credential = result.formattedSubmission.entries[0].credentials.find(
      (c) => c.credential.record.id === request.selectedEntry.credentialId
    )
    if (!credential)
      throw new Error(
        `Could not find selected credential with id '${request.selectedEntry.credentialId}' in formatted submission`
      )

    // Update to only contain the already selected credential
    result.formattedSubmission.entries[0].credentials = [credential]
  }

  return {
    ...result,
    verifier: {
      ...result.verifier,
      hostName: getHostNameFromUrl(request.origin),
    },
  }
}

export async function sendResponseForDcApi({
  agent,
  resolvedRequest,
  dcRequest,
  fetchBatchCredentialCallback,
}: {
  agent: OpenId4VcAgent
  resolvedRequest: CredentialsForProofRequest
  dcRequest: DigitalCredentialsRequest

  fetchBatchCredentialCallback?: FetchBatchCredentialCallback
}) {
  const firstEntry = resolvedRequest.formattedSubmission.entries[0]
  if (!firstEntry.isSatisfied) {
    agent.config.logger.debug('Expected one entry for DC API response', {
      resolvedRequest,
      dcRequest,
    })
    throw new Error('Expected one entry for DC API response')
  }

  const result = await shareProof({
    agent,
    resolvedRequest,
    fetchBatchCredentialCallback,
    selectedCredentials: {
      [firstEntry.inputDescriptorId]: dcRequest.selectedEntry.credentialId,
    },
  })

  agent.config.logger.debug('Sending response for Digital Credentials API', {
    result,
  })

  sendResponse({
    response: JSON.stringify(result.authorizationResponse),
  })
}

export async function sendErrorResponseForDcApi(errorMessage: string) {
  sendErrorResponse({
    errorMessage,
  })
}
