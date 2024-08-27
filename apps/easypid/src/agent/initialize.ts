import { trustedX509Certificates } from '@easypid/constants'
import { initializeEasyPIDAgent } from '@package/agent'

export function initializeAppAgent({ walletKey, walletKeyVersion }: { walletKey: string; walletKeyVersion: number }) {
  return initializeEasyPIDAgent({
    keyDerivation: 'raw',
    walletId: `easypid-wallet-${walletKeyVersion}`,
    walletKey,
    walletLabel: 'EasyPID Wallet',
    trustedX509Certificates,
  })
}
