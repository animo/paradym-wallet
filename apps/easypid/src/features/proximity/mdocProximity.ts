import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { COSEKey, DeviceRequest, DeviceResponse, MDoc, type MdocContext, parseIssuerSigned } from '@animo-id/mdoc'
import { TypedArrayEncoder } from '@credo-ts/core'
import { getMdocContext } from '@credo-ts/core/build/modules/mdoc/MdocContext'
import type { EasyPIDAppAgent } from '@package/agent'
import { type Permission, PermissionsAndroid, Platform } from 'react-native'

type ShareDeviceResponseOptions = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  agent: EasyPIDAppAgent
}

const PERMISSIONS = [
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.BLUETOOTH_CONNECT',
  'android.permission.BLUETOOTH_SCAN',
  'android.permission.BLUETOOTH_ADVERTISE',
  'android.permission.ACCESS_COARSE_LOCATION',
] as const as Permission[]

export const requestMdocPermissions = async () => {
  if (Platform.OS !== 'android') return
  await PermissionsAndroid.requestMultiple(PERMISSIONS)
}

export const getMdocQrCode = async () => {
  const mdt = mdocDataTransfer.instance()
  const qrData = await mdt.startQrEngagement()
  return qrData
}

/**
 *
 * Wait for the device request
 *
 * Returns the device request and session transcript
 *
 */
export const waitForDeviceRequest = async () => {
  const mdt = mdocDataTransfer.instance()
  const { deviceRequest, sessionTranscript } = await mdt.waitForDeviceRequest()
  const decodedDeviceRequest = DeviceRequest.parse(deviceRequest)
  const requestedItems = decodedDeviceRequest.docRequests.map((d) => d.itemsRequest.data.nameSpaces)

  return { deviceRequest, sessionTranscript, requestedItems }
}

/**
 *
 * Naive way to share the device response based on the device request
 *
 * Optimalisations:
 *
 * 1. pre-filter the `agent.mdoc.getAll()` based on the `deviceRequest`
 * 2. Allow the user to pick which specific mdoc is being used
 *
 */
export const shareDeviceResponse = async (options: ShareDeviceResponseOptions) => {
  const mdocs = await options.agent.mdoc.getAll()
  const issuerSignedDocuments = mdocs.map((mdoc) => {
    const docType = mdoc.getTag('DocType') as string
    return parseIssuerSigned(TypedArrayEncoder.fromBase64(mdoc.base64Url), docType)
  })

  const mdoc = new MDoc(issuerSignedDocuments)

  const mdocContext = getMdocContext(options.agent.context) as unknown as {
    cose: MdocContext['cose']
    crypto: MdocContext['crypto']
  }

  const mdt = mdocDataTransfer.instance()

  const mso = mdoc.documents[0].issuerSigned.issuerAuth.decodedPayload
  const deviceKeyInfo = mso.deviceKeyInfo
  if (!deviceKeyInfo?.deviceKey) {
    throw new Error('Device key info is missing')
  }

  const publicDeviceJwk = COSEKey.import(deviceKeyInfo.deviceKey).toJWK()

  const deviceRequest = DeviceRequest.parse(options.deviceRequest)

  const deviceResponse = await DeviceResponse.from(mdoc)
    .usingSessionTranscriptBytes(new Uint8Array(options.sessionTranscript))
    .usingDeviceRequest(deviceRequest)
    .authenticateWithSignature(publicDeviceJwk, 'ES256')
    .sign(mdocContext)

  await mdt.sendDeviceResponse(deviceResponse.encode())
}
