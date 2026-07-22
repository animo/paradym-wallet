import { QrScannerScreen } from '@package/app'
import { credentialDataHandlerOptions } from '../_layout'

export default function Screen() {
  return <QrScannerScreen credentialDataHandlerOptions={{ ...credentialDataHandlerOptions, routeMethod: 'replace' }} />
}
