import { initializeFunkeAgent } from '@package/agent'
import { trustedCertificates } from '../constants'

export function initializeAppAgent({ walletKey }: { walletKey: string }) {
  return initializeFunkeAgent({
    keyDerivation: 'raw',
    walletId: 'funke-wallet',
    walletKey: walletKey,
    walletLabel: 'Funke Wallet',
    trustedX509Certificates: trustedCertificates,
  })
}
