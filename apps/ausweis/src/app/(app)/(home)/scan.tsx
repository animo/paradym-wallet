import { QrScannerScreen } from '@package/app'

export default function Screen() {
  return <QrScannerScreen allowedInvitationTypes={['openid-authorization-request']} />
}
