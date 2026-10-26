/**
 * Base id of the wallet's askar store, without the wallet key version. `getWalletStoreId` composes
 * the two, for the app and the credential request UI alike.
 *
 * Must stay 'paradym-wallet': it determines the on-disk store id of existing installs.
 */
export const walletId = 'paradym-wallet'

/**
 * Base ids the store had before {@link walletId}. On unlock, an install without a store under
 * {@link walletId} has its store moved over from these.
 *
 * 1.21 and 1.22 used 'easypid-wallet', the Funke wallet's id, by mistake.
 */
export const legacyWalletIds = ['easypid-wallet']
