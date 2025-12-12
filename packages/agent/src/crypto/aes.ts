import { type AgentContext, Hasher } from '@credo-ts/core'
import { Key, KeyAlgorithm } from '@openwallet-foundation/askar-react-native'

const AES_256_STATIC_SEED = new Uint8Array(12).fill(10)

const aes256GcmGenerateAndStoreKey = (_: string) => async (_options: { agentContext: AgentContext }) => {
  // no-op
}

const aes256GcmHasKey = (_: string) => async (_options: { agentContext: AgentContext }) => {
  // no-op
  return true
}

const aes256GcmGetKey = (_: string) => async (_: { agentContext: AgentContext }) => {
  return Key.fromSeed({ algorithm: KeyAlgorithm.AesA256Gcm, seed: AES_256_STATIC_SEED })
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
    const key = await aes256GcmGetKey(id)({ agentContext })
    const { ciphertextWithTag } = key.aeadEncrypt({ nonce, message: data })
    return ciphertextWithTag
  }

export const aes256Gcm = (id: string) => ({
  aes256GcmGenerateAndStoreKey: aes256GcmGenerateAndStoreKey(id),
  aes256GcmHasKey: aes256GcmHasKey(id),
  aes256GcmEncrypt: aes256GcmEncrypt(id),
})
