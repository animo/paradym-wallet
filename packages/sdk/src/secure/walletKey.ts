import { TypedArrayEncoder } from '@credo-ts/core'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'
import { WalletUnlockError } from './error/WalletUnlockError'
import { kdf } from './kdf'
import { walletKeySaltStore } from './secure-wallet-key/walletKeySaltStore'
import { walletKeyStore } from './secure-wallet-key/walletKeyStore'

// Deliberately free of react and react-query, so the credential request UI can import it without
// pulling the app's hooks into a bundle that has no use for them.

/**
 * Derive the wallet key from the PIN and the salt held in the keychain.
 */
export async function getWalletKeyUsingPin(pin: string, version: number) {
  const salt = await walletKeySaltStore.getSalt(version)
  if (!salt) {
    // The version is in the message because it names the keychain item: the credential request UI
    // reads it from the shared settings, and a version mismatch looks exactly like a missing salt.
    throw new WalletUnlockError(
      `Error unlocking wallet. No salt configured for wallet key version ${version} (PARADYM_WALLET_SALT_${version})`
    )
  }

  // The wallet key needs to be a xchacha key, so the hash derived from pin and salt seeds it.
  return NativeAskar.instance.storeGenerateRawKey({
    seed: TypedArrayEncoder.fromUtf8String(kdf.derive(pin, salt)),
  })
}

/**
 * The biometrics protected wallet key, or `null` when biometric unlock is not set up.
 */
export function getWalletKeyUsingBiometrics(version: number) {
  return walletKeyStore.getWalletKeyUsingBiometrics(version)
}
