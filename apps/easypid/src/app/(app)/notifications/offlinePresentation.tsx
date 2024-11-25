import { FunkeMdocOfflineSharingScreen } from '@easypid/features/share/FunkeMdocOfflineSharingScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { sessionTranscript, deviceRequest } = useLocalSearchParams()

  const sessionTranscriptArray = new Uint8Array(Buffer.from(sessionTranscript as string, 'base64'))
  const deviceRequestArray = new Uint8Array(Buffer.from(deviceRequest as string, 'base64'))

  return <FunkeMdocOfflineSharingScreen sessionTranscript={sessionTranscriptArray} deviceRequest={deviceRequestArray} />
}
