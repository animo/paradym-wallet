import { cborDecode, cborEncode, DataItem } from '@owf/cose'
import type { FormattedSubmission, ParadymWalletSdk } from '@paradym/wallet-sdk'
import { mdocDataTransfer } from 'expo-mdoc-data-transfer'
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
  const deviceResponse = await options.paradym.proximity.createDeviceResponse({
    deviceRequest: options.deviceRequest,
    sessionTranscript: options.sessionTranscript,
    submission: options.submission,
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
