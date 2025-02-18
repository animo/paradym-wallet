import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { DataItem, DeviceRequest, cborDecode, cborEncode } from '@animo-id/mdoc'
import { Mdoc, MdocService, TypedArrayEncoder } from '@credo-ts/core'
import type { AppAgent } from '@easypid/agent'
import type { FormattedSubmission, MdocRecord } from '@package/agent'
import { handleBatchCredential } from '@package/agent/src/batch'
import { PermissionsAndroid, Platform } from 'react-native'

type ShareDeviceResponseOptions = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  agent: AppAgent
  submission: FormattedSubmission
}

export const requestMdocPermissions = async () => {
  if (Platform.OS !== 'android') return

  if (Platform.Version >= 31) {
    return await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    ])
  }
  return await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ])
}

export const checkMdocPermissions = async () => {
  if (Platform.OS !== 'android') return true

  if (Platform.Version >= 31) {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
  }
  return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
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
 * Send a device response based on the device request
 * Optimalisations:
 * 1. Allow the user to pick which specific mdoc is being used
 */
export const shareDeviceResponse = async (options: ShareDeviceResponseOptions) => {
  if (!options.submission.areAllSatisfied) {
    throw new Error('Not all requirements are satisfied')
  }

  const mdocs = await Promise.all(
    options.submission.entries.map(async (e) => {
      if (!e.isSatisfied) throw new Error(`Requirement for doctype ${e.inputDescriptorId} not satisfied`)

      const credential = e.credentials[0].credential.record as MdocRecord

      // Optionally handle batch issuance
      const credentialRecord = await handleBatchCredential(options.agent, credential)

      return Mdoc.fromBase64Url(credentialRecord.base64Url, credential.getTags().docType)
    })
  )

  const mdocService = options.agent.dependencyManager.resolve(MdocService)

  // TODO: return type in credo should be Uint8Array
  const { deviceResponseBase64Url } = await mdocService.createDeviceResponse(options.agent.context, {
    deviceRequest: DeviceRequest.parse(options.deviceRequest),
    mdocs: mdocs as [Mdoc, ...Mdoc[]],
    sessionTranscriptBytes: options.sessionTranscript,
  })

  const mdt = mdocDataTransfer.instance()
  await mdt.sendDeviceResponse(TypedArrayEncoder.fromBase64(deviceResponseBase64Url))
}

export const shutdownDataTransfer = () => {
  const mdt = mdocDataTransfer.instance()
  mdt.shutdown()
}
