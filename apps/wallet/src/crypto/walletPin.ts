import { paradymWalletSdkOptions } from '@app/config/paradym'
import { AskarModule, AskarStoreInvalidKeyError } from '@credo-ts/askar'
import { Agent, CredoError } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'
import {
  getWalletStoreDatabaseConfig,
  getWalletStoreDirectories,
  moveLegacyStore,
  ParadymWalletAuthenticationInvalidPinError,
  secureWalletKey,
  setupAppGroupStore,
} from '@paradym/wallet-sdk'

// Validation askar store id. Sits next to the main wallet
// (`${paradymWalletSdkOptions.id}-${walletKeyVersion}`) on disk and must use a
// different id so the two stores never conflict.
const getValidationStoreId = (walletKeyVersion: number, id = paradymWalletSdkOptions.id) =>
  `${id}-pin-validation-${walletKeyVersion}`

// The validation store created by `validateWalletPin` lives in its own
// askar wallet directory. It must be wiped alongside the main wallet during a
// reset, otherwise a new PIN would derive a wallet key that can't open the old
// validation store, producing a spurious "invalid PIN" error on the next proof.
export const resetWalletPinValidation = async () => {
  const fs = new agentDependencies.FileSystem()
  const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
  const validationStoreIds = [paradymWalletSdkOptions.id, ...(paradymWalletSdkOptions.legacyIds ?? [])].map((id) =>
    getValidationStoreId(walletKeyVersion, id)
  )

  // Legacy ones too: one left behind would be moved back in on the next PIN entry.
  for (const p of validationStoreIds.flatMap(getWalletStoreDirectories)) {
    if (await fs.exists(p)) await fs.delete(p)
  }
}

/**
 * Checks a PIN entered to confirm a share by opening a store keyed to it. The first call, during
 * onboarding, creates that store.
 *
 * @throws {ParadymWalletAuthenticationInvalidPinError} the PIN is not the wallet PIN
 */
export const validateWalletPin = async (pinString: string) => {
  const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
  const walletKey = await secureWalletKey.getWalletKeyUsingPin(pinString, walletKeyVersion)
  const validationStoreId = getValidationStoreId(walletKeyVersion)

  // Moved along with the wallet's own store when its id changed: a missing one would be
  // provisioned with whatever PIN is typed here, right or wrong.
  await moveLegacyStore(
    validationStoreId,
    (paradymWalletSdkOptions.legacyIds ?? []).map((legacyId) => getValidationStoreId(walletKeyVersion, legacyId))
  )

  // On iOS this store lives in the container shared with the identity document provider
  // extension, so the request UI validates a PIN against the same store the app does. Existing
  // stores are moved there rather than left behind: a second one would be provisioned on the
  // first PIN entry and lock the check to whatever was typed then, right or wrong.
  const storePath = await setupAppGroupStore(validationStoreId)

  const agent = new Agent({
    config: {},
    modules: {
      askar: new AskarModule({
        askar: NativeAskar.instance,
        store: {
          id: validationStoreId,
          key: walletKey,
          keyDerivationMethod: 'raw',
          ...getWalletStoreDatabaseConfig(storePath),
        },
      }),
    },
    dependencies: agentDependencies,
  })

  try {
    await agent.initialize()
  } catch (error) {
    if (error instanceof CredoError && error.cause instanceof AskarStoreInvalidKeyError) {
      throw new ParadymWalletAuthenticationInvalidPinError()
    }
    throw error
  }

  await agent.shutdown()
}
