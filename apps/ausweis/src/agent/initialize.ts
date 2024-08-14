import { trustedX509Certificates } from '@ausweis/constants'
import { initializeAusweisAgent } from '@package/agent'

export function initializeAppAgent({ walletKey }: { walletKey: string }) {
  return initializeAusweisAgent({
    keyDerivation: 'raw',
    walletId: 'ausweis-wallet',
    walletKey,
    walletLabel: 'Ausweis Wallet',
    trustedX509Certificates,
  })
}
