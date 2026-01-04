import { isFunkeWallet } from '../hooks/useFeatureFlag'

export function getWalletId(walletKeyVersion: number) {
  return isFunkeWallet() ? `easypid-wallet-${walletKeyVersion}` : `paradym-wallet-${walletKeyVersion}`
}
