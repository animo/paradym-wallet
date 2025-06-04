import { KeyManagementServiceClient } from '@google-cloud/kms'

// TODO: Maybe change this to arguments or env variables
const projectId = 'funke-441515'
const locationId = 'europe-west4'

console.info('🚀 Starting KMS cleanup script for project:', projectId, 'in location:', locationId)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForReadRatelimit = async () => await delay((60 / 300) * 1100)

const waitForWriteRatelimit = async () => await delay((60 / 60) * 1100)

// Instantiates a client
const client = new KeyManagementServiceClient({
  projectId,
})

async function run() {
  for await (const keyRing of client.listKeyRingsAsync({
    parent: client.locationPath(projectId, locationId),
  })) {
    console.group(`💍 Processing Key Ring: ${keyRing.name}`)
    console.log('🔍 Listing keys...')

    await waitForReadRatelimit()

    for await (const key of client.listCryptoKeysAsync({
      parent: keyRing.name,
    })) {
      console.group(`  🔑 Processing Key: ${key.name}`)
      console.log('  🔍 Listing versions...')

      await waitForReadRatelimit()

      for await (const version of client.listCryptoKeyVersionsAsync({
        parent: key.name,
        filter: 'state = ENABLED',
      })) {
        await waitForReadRatelimit()

        console.log(`    ⚙️ Processing Version: ${version.name} (State: ${version.state})`)

        if (version.state !== 'ENABLED') {
          console.warn(`    ⏩ Skipping non-ENABLED version: ${version.name}`)
          continue
        }

        console.log(`    🔥 Destroying version: ${version.name}...`)
        await client.destroyCryptoKeyVersion({
          name: version.name,
        })
        console.log(`    ✅ Successfully destroyed version: ${version.name}`)
        await waitForWriteRatelimit()
      }
      console.groupEnd() // End key group
    }
    console.groupEnd() // End key ring group
  }

  console.info('✅ Script finished.')
}
