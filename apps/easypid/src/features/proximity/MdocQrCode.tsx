import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { useAppAgent } from '@easypid/agent'
import { Loader } from '@package/ui'
import { useState } from 'react'
import { type Permission, PermissionsAndroid } from 'react-native'
import QrCode from 'react-native-qrcode-svg'
import { shareDeviceResponse } from './shareDeviceResponse'
import { waitForDeviceRequestAndSessionTranscript } from './waitForDeviceRequestAndSessionTranscript'

const PERMISSIONS = [
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.BLUETOOTH_CONNECT',
  'android.permission.BLUETOOTH_SCAN',
  'android.permission.BLUETOOTH_ADVERTISE',
  'android.permission.ACCESS_COARSE_LOCATION',
] as const as Permission[]

export const MdocQrCode = () => {
  const { agent } = useAppAgent()
  const [qrCodeData, setQrCodeData] = useState<string>()

  const func = async () => {
    await PermissionsAndroid.requestMultiple(PERMISSIONS)
    const mdt = mdocDataTransfer.instance()
    const qrData = await mdt.startQrEngagement()
    setQrCodeData(qrData)
    const { sessionTranscript, deviceRequest } = await waitForDeviceRequestAndSessionTranscript()
    await shareDeviceResponse({ agent, deviceRequest, sessionTranscript })
  }

  if (!qrCodeData) {
    return <Loader size="large" onPress={func} />
  }

  return <QrCode value={qrCodeData} />
}
