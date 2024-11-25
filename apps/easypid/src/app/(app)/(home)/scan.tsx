import { FunkeQrScannerScreen } from '@easypid/features/scan/FunkeQrScannerScreen'
import type { CredentialDataHandlerOptions } from '@package/app'

// When going form the scanner we want to replace (as we have the modal)
export const credentialDataHandlerOptions = {
  routeMethod: 'replace',
} satisfies CredentialDataHandlerOptions

export default function Screen() {
  return <FunkeQrScannerScreen credentialDataHandlerOptions={credentialDataHandlerOptions} />
}
