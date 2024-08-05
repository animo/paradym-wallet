import { initializeFunkeAgent } from '@package/agent'
import { trustedX509Certificates } from '../constants'

export function initializeAppAgent({ walletKey }: { walletKey: string }) {
  return initializeFunkeAgent({
    keyDerivation: 'raw',
    walletId: 'funke-wallet',
    walletKey,
    walletLabel: 'Funke Wallet',
    trustedX509Certificates,
  })
}
