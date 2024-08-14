import type { Agent } from '@credo-ts/core'
import { FUNKE_WALLET_SEED_CREDENTIAL_RECORD_ID } from '@funke/constants'
import { walletJsonStore } from '@package/agent'

export const seedCredentialStorage = {
  store: async (agent: Agent, seedCredential: string) =>
    walletJsonStore.store(agent, FUNKE_WALLET_SEED_CREDENTIAL_RECORD_ID, {
      seedCredential,
    }),

  update: async (agent: Agent, seedCredential: string) =>
    walletJsonStore.update(agent, FUNKE_WALLET_SEED_CREDENTIAL_RECORD_ID, {
      seedCredential,
    }),

  getById: async (agent: Agent) =>
    walletJsonStore.getById<{ seedCredential: string }>(agent, FUNKE_WALLET_SEED_CREDENTIAL_RECORD_ID),
}
