import { trustedX509Certificates } from '@funke/constants'
import { initializeFunkeAgent } from '@package/agent'

export function initializeAppAgent({ walletKey }: { walletKey: string }) {
  return initializeFunkeAgent({
    keyDerivation: 'raw',
    walletId: 'funke-wallet',
    walletKey,
    walletLabel: 'Funke Wallet',
    trustedX509Certificates,
  })
}
