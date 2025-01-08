import { type CredentialDataHandlerOptions, QrScannerScreen } from '@package/app'

// When going form the scanner we want to replace (as we have the modal)
export const credentialDataHandlerOptions = {
  routeMethod: 'replace',
} satisfies CredentialDataHandlerOptions

export default function Screen() {
  return <QrScannerScreen credentialDataHandlerOptions={credentialDataHandlerOptions} />
}
