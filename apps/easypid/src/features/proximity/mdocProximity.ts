import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import {
  COSEKey,
  DataItem,
  DeviceRequest,
  DeviceResponse,
  MDoc,
  type MdocContext,
  cborDecode,
  cborEncode,
  parseIssuerSigned,
} from '@animo-id/mdoc'
import { TypedArrayEncoder } from '@credo-ts/core'
import { getMdocContext } from '@credo-ts/core/build/modules/mdoc/MdocContext'
import type { EasyPIDAppAgent, FormattedSubmission, MdocRecord } from '@package/agent'
import { handleBatchCredential } from '@package/agent/src/batch'
import { type Permission, PermissionsAndroid, Platform } from 'react-native'

type ShareDeviceResponseOptions = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  agent: EasyPIDAppAgent
  submission: FormattedSubmission
}

// Determine if device is running Android 12 or higher
const isAndroid12OrHigher = Platform.OS === 'android' && Platform.Version >= 31

// Older devices require different permissions for BLE transfers
const PERMISSIONS = (
  isAndroid12OrHigher
    ? [
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_ADVERTISE',
      ]
    : ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION']
) as Permission[]

export const requestMdocPermissions = async () => {
  if (Platform.OS !== 'android') return
  return await PermissionsAndroid.requestMultiple(PERMISSIONS)
}

export const checkMdocPermissions = async () => {
  if (Platform.OS !== 'android') return

  // We assume if you don't have the first permission, you don't have the others either
  // As we can not check multiple at once
  return await PermissionsAndroid.check(PERMISSIONS[1])
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

  // current bug on android required re-encapsulation
  const encodedSessionTranscript =
    Platform.OS === 'android' ? cborEncode(DataItem.fromData(cborDecode(sessionTranscript))) : sessionTranscript

  return { deviceRequest, sessionTranscript: encodedSessionTranscript }
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
  if (!options.submission.areAllSatisfied) {
    throw new Error('Not all requirements are satisfied')
  }

  if (options.submission.entries.length > 1) {
    throw new Error('Only one mdoc supported at the moment due to only being able to sign with one device key')
  }

  const issuerSignedDocuments = await Promise.all(
    options.submission.entries.map(async (e) => {
      if (!e.isSatisfied) throw new Error(`Requirement for doctype ${e.inputDescriptorId} not satisfied`)

      const credential = e.credentials[0].credential.record as MdocRecord

      // Optionally handle batch issuance
      const credentialRecord = await handleBatchCredential(options.agent, credential)

      return parseIssuerSigned(TypedArrayEncoder.fromBase64(credentialRecord.base64Url), credential.getTags().docType)
    })
  )

  const mdoc = new MDoc(issuerSignedDocuments)

  const mdocContext = getMdocContext(options.agent.context) as unknown as {
    cose: MdocContext['cose']
    crypto: MdocContext['crypto']
  }

  const mdt = mdocDataTransfer.instance()

  if (mdoc.documents.length > 1) {
    throw new Error('Only one mdoc supported at the moment due to only being able to sign with one device key')
  }
  const mso = mdoc.documents[0].issuerSigned.issuerAuth.decodedPayload
  const deviceKeyInfo = mso.deviceKeyInfo
  if (!deviceKeyInfo?.deviceKey) {
    throw new Error('Device key info is missing')
  }

  const publicDeviceJwk = COSEKey.import(deviceKeyInfo.deviceKey).toJWK()
  const deviceRequest = DeviceRequest.parse(options.deviceRequest)

  const deviceResponse = await DeviceResponse.from(mdoc)
    .usingSessionTranscriptBytes(options.sessionTranscript)
    .usingDeviceRequest(deviceRequest)
    .authenticateWithSignature(publicDeviceJwk, 'ES256')
    .sign(mdocContext)

  await mdt.sendDeviceResponse(deviceResponse.encode())
}

export const shutdownDataTransfer = () => {
  const mdt = mdocDataTransfer.instance()
  mdt.shutdown()
}
