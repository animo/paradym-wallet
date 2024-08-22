import { trustedX509Certificates } from '@easypid/constants'
import { initializeEasyPIDAgent } from '@package/agent'

export function initializeAppAgent({ walletKey }: { walletKey: string }) {
  return initializeEasyPIDAgent({
    keyDerivation: 'raw',
    walletId: 'ausweis-wallet',
    walletKey,
    walletLabel: 'EasyPID Wallet',
    trustedX509Certificates,
  })
}
