import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { DataItem, DeviceRequest, cborDecode, cborEncode } from '@animo-id/mdoc'
import { Mdoc, type MdocRecord, MdocService } from '@credo-ts/core'
import { refreshPid } from '@easypid/use-cases/RefreshPidUseCase'
import type { BaseAgent } from '@paradym/wallet-sdk/agent'
import type { FormattedSubmission } from '@paradym/wallet-sdk/format/submission'
import { handleBatchCredential } from '@paradym/wallet-sdk/openid4vc/batch'
import { PermissionsAndroid, Platform } from 'react-native'

type ShareDeviceResponseOptions = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  agent: BaseAgent
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
  mdt.enableNfc()
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

  console.log({ deviceRequest, sessionTranscript })

  // current bug on android required re-encapsulation
  const encodedSessionTranscript =
    Platform.OS === 'android' ? cborEncode(DataItem.fromData(cborDecode(sessionTranscript))) : sessionTranscript

  const y = { deviceRequest, sessionTranscript: encodedSessionTranscript }
  console.log(y)
  return y
}

/**
 * Send a device response based on the device request
 * Optimalisations:
 * 1. Allow the user to pick which specific mdoc is being used
 */
export const shareDeviceResponse = async (options: ShareDeviceResponseOptions) => {
  // if (!options.submission.areAllSatisfied) {
  //   throw new Error('Not all requirements are satisfied')
  // }

  const mdocs = await Promise.all(
    options.submission.entries.map(async (e) => {
      if (!e.isSatisfied) throw new Error(`Requirement for doctype ${e.inputDescriptorId} not satisfied`)

      const credential = e.credentials[0].credential.record as MdocRecord

      // Optionally handle batch issuance
      const credentialRecord = (await handleBatchCredential(options.agent, credential, refreshPid)) as MdocRecord

      return Mdoc.fromBase64Url(credentialRecord.base64Url, credential.getTags().docType)
    })
  )

  const mdocService = options.agent.dependencyManager.resolve(MdocService)

  const deviceResponse = await mdocService.createDeviceResponse(options.agent.context, {
    documentRequests: DeviceRequest.parse(options.deviceRequest).docRequests.map((d) => ({
      docType: d.itemsRequest.data.docType,
      nameSpaces: Object.fromEntries(
        Array.from(d.itemsRequest.data.nameSpaces.entries()).map(([namespace, entry]) => [
          namespace,
          Object.fromEntries(Array.from(entry.entries())),
        ])
      ),
    })),
    mdocs: mdocs as [Mdoc, ...Mdoc[]],
    sessionTranscriptOptions: {
      type: 'sesionTranscriptBytes',
      sessionTranscriptBytes: options.sessionTranscript,
    },
  })

  const mdt = mdocDataTransfer.instance()
  await mdt.sendDeviceResponse(deviceResponse)
}

export const shutdownDataTransfer = () => {
  if (isDataTransferInitialized()) {
    const mdt = mdocDataTransfer.instance()
    mdt.shutdown()
  }
}

export const isDataTransferInitialized = () => {
  return mdocDataTransfer.isInitialized()
}
