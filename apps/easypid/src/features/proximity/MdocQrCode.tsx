import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { Loader } from '@package/ui'
import { useEffect, useState } from 'react'
import QrCode from 'react-native-qrcode-svg'

export const MdocQrCode = () => {
  const [qrCodeData, setQrCodeData] = useState<string>()

  useEffect(() => {
    const mdt = mdocDataTransfer.instance()
    mdt.startQrEngagement().then(setQrCodeData)
  }, [])

  if (!qrCodeData) {
    return <Loader size="large" />
  }

  return <QrCode value={qrCodeData} />
}
