import { assertAskarWallet } from '@credo-ts/askar/build/utils/assertAskarWallet'
import { type AgentContext, Hasher } from '@credo-ts/core'
import { Key, KeyAlgs } from '@hyperledger/aries-askar-react-native'

const aes256GcmGenerateAndStoreKey =
  (id: string) =>
  async ({ agentContext }: { agentContext: AgentContext }) => {
    const wallet = agentContext.wallet
    const key = Key.generate(KeyAlgs.AesA256Gcm)
    assertAskarWallet(wallet)
    await wallet.withSession((session) => session.insertKey({ name: id, key }))
  }

const aes256GcmHasKey =
  (id: string) =>
  async ({ agentContext }: { agentContext: AgentContext }) => {
    const wallet = agentContext.wallet
    assertAskarWallet(wallet)
    const aesKey = await wallet.withSession((session) => session.fetchKey({ name: id }))

    return Boolean(aesKey)
  }

const aes256GcmGetKey =
  (id: string) =>
  async ({ agentContext }: { agentContext: AgentContext }) => {
    const wallet = agentContext.wallet
    assertAskarWallet(wallet)
    const aesKey = await wallet.withSession((session) => session.fetchKey({ name: id }))

    if (!aesKey) {
      throw new Error(`AES-256-GCM key not found with id: ${id}`)
    }

    return aesKey.key
  }

const aes256GcmEncrypt =
  (id: string) =>
  async ({
    data,
    agentContext,
    /**
     *
     * for IV, please use hash of a user-entered PIN, with a hash function of sha-256
     *
     */
    nonce = Hasher.hash(data, 'sha-256').slice(0, 12),
  }: {
    data: Uint8Array
    agentContext: AgentContext
    nonce?: Uint8Array
  }) => {
    const wallet = agentContext.wallet
    assertAskarWallet(wallet)

    const key = await aes256GcmGetKey(id)({ agentContext })

    const { ciphertextWithTag } = key.aeadEncrypt({ nonce, message: data })

    return ciphertextWithTag
  }

export const aes256Gcm = (id: string) => ({
  aes256GcmGenerateAndStoreKey: aes256GcmGenerateAndStoreKey(id),
  aes256GcmHasKey: aes256GcmHasKey(id),
  aes256GcmEncrypt: aes256GcmEncrypt(id),
})
