/**
 * Base id of the wallet's askar store, without the wallet key version.
 *
 * Must stay 'easypid-wallet': together with the version it determines the on-disk store id of
 * existing installs. `getWalletStoreId` composes the two, for the app and the credential request UI
 * alike.
 */
export const walletId = 'easypid-wallet'
