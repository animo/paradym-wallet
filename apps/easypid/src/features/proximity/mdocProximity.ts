import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { cborDecode, cborEncode, DataItem, DeviceRequest } from '@animo-id/mdoc'
import {
  CredentialMultiInstanceUseMode,
  type Mdoc,
  type MdocRecord,
  MdocService,
  useInstanceFromCredentialRecord,
} from '@credo-ts/core'
import { refreshPidIfNeeded } from '@easypid/use-cases/RefreshPidUseCase'
import type { FormattedSubmission, ParadymWalletSdk } from '@paradym/wallet-sdk'
import { PermissionsAndroid, Platform } from 'react-native'

type ShareDeviceResponseOptions = {
  paradym: ParadymWalletSdk
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
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
  // if (!options.submission.areAllSatisfied) {
  //   throw new Error('Not all requirements are satisfied')
  // }

  const mdocs = await Promise.all(
    options.submission.entries.map(async (e) => {
      if (!e.isSatisfied) throw new Error(`Requirement for doctype ${e.inputDescriptorId} not satisfied`)

      const credentialRecord = e.credentials[0].credential.record as MdocRecord

      // FIXME: we should move this to the request screen. If there's no new credentials we should add a 'refresh' button?
      // Or we should just do it in the background (but may not be possible)
      // Refresh pid if needed
      await refreshPidIfNeeded(options.paradym, credentialRecord)

      // Optionally handle batch issuance
      const { credentialInstance } = await useInstanceFromCredentialRecord({
        credentialRecord,
        agentContext: options.paradym.agent.context,
        // FIXME: we currently allow re-sharing if we don't have new instances anymore
        // we should make this configurable maybe? Or dependant on credential type?
        useMode: CredentialMultiInstanceUseMode.NewOrFirst,
      })

      return credentialInstance
    })
  )

  const mdocService = options.paradym.agent.dependencyManager.resolve(MdocService)

  const deviceResponse = await mdocService.createDeviceResponse(options.paradym.agent.context, {
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
