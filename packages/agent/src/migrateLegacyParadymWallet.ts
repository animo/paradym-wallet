import { agentDependencies } from '@credo-ts/react-native'
import { KdfMethod, Store, StoreKeyMethod } from '@openwallet-foundation/askar-react-native'
import * as RNFS from 'react-native-fs'

export async function migrateLegacyParadymWallet(options: {
  walletKeyVersion: number
  legacyWalletKey: {
    walletKey: string
    keyDerivation: 'raw' | 'derive'
  }
  newWalletKey: string
}) {
  const legacyWalletId = 'paradym-wallet-secure'
  const newWalletId = `paradym-wallet-${options.walletKeyVersion}`
  const fs = new agentDependencies.FileSystem()

  const oldStore = await Store.open({
    uri: `sqlite://${fs.dataPath}/wallet/${legacyWalletId}/sqlite.db`,
    keyMethod: new StoreKeyMethod(
      options.legacyWalletKey.keyDerivation === 'raw' ? KdfMethod.Raw : KdfMethod.Argon2IMod
    ),
    passKey: options.legacyWalletKey.walletKey,
    profile: legacyWalletId,
  })

  const newDirectory = `${fs.dataPath}/wallet/${newWalletId}`
  if (await RNFS.exists(newDirectory)) return
  await RNFS.mkdir(newDirectory)

  const newStore = await Store.provision({
    uri: `sqlite://${newDirectory}/sqlite.db`,
    keyMethod: new StoreKeyMethod(KdfMethod.Raw),
    passKey: options.newWalletKey,
    profile: newWalletId,
    recreate: true,
  })

  const oldSession = await oldStore.session(legacyWalletId).open()
  const newSession = await newStore.session(newWalletId).open()

  // JS wrapper has category as required, but it's not required
  const oldRecords = await oldSession.fetchAll({})

  console.log(`migrating ${oldRecords.length} records`)
  // Rotate key to the new raw key
  for (const record of oldRecords) {
    await newSession.insert(record)
  }

  const oldKeys = await oldSession.fetchAllKeys({})
  console.log(`migrating ${oldKeys.length} keys`)
  for (const key of oldKeys) {
    await newSession.insertKey({
      key: key.key,
      name: key.name,
      metadata: key.metadata ?? undefined,
      tags: key.tags,
    })
  }
}
