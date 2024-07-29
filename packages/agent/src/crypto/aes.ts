import { assertAskarWallet } from '@credo-ts/askar/build/utils/assertAskarWallet'
import type { AgentContext } from '@credo-ts/core'
import { Key, KeyAlgs } from '@hyperledger/aries-askar-react-native'

const aes128GcmGenerateAndStoreKey =
  (id: string) =>
  async ({ agentContext }: { agentContext: AgentContext }) => {
    const wallet = agentContext.wallet
    const key = Key.generate(KeyAlgs.AesA128Gcm)
    assertAskarWallet(wallet)
    await wallet.withSession((session) => session.insertKey({ name: id, key }))
  }

const aes128GcmHasKey =
  (id: string) =>
  async ({ agentContext }: { agentContext: AgentContext }) => {
    const wallet = agentContext.wallet
    assertAskarWallet(wallet)
    const aesKey = await wallet.withSession((session) => session.fetchKey({ name: id }))

    return Boolean(aesKey)
  }

const aes128GcmGetKey =
  (id: string) =>
  async ({ agentContext }: { agentContext: AgentContext }) => {
    const wallet = agentContext.wallet
    assertAskarWallet(wallet)
    const aesKey = await wallet.withSession((session) => session.fetchKey({ name: id }))

    if (!aesKey) {
      throw new Error(`AES-128-GCM key not found with id: ${id}`)
    }

    return aesKey.key
  }

const aes128GcmEncrypt =
  (id: string) =>
  async ({
    data,
    agentContext,
    nonce = new Uint8Array(12).fill(1),
  }: {
    data: Uint8Array
    agentContext: AgentContext
    nonce?: Uint8Array
  }) => {
    const wallet = agentContext.wallet
    assertAskarWallet(wallet)

    const key = await aes128GcmGetKey(id)({ agentContext })

    const { ciphertextWithTag } = key.aeadEncrypt({ nonce, message: data })

    return ciphertextWithTag
  }

export const aes128Gcm = (id: string) => ({
  aes128GcmGenerateAndStoreKey: aes128GcmGenerateAndStoreKey(id),
  aes128GcmHasKey: aes128GcmHasKey(id),
  aes128GcmEncrypt: aes128GcmEncrypt(id),
})
