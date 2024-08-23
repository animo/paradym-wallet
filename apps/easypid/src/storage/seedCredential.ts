import type { Agent } from '@credo-ts/core'
import { EASYPID_WALLET_SEED_CREDENTIAL_RECORD_ID } from '@easypid/constants'
import { walletJsonStore } from '@package/agent'

export const seedCredentialStorage = {
  store: async (agent: Agent, seedCredential: string) =>
    walletJsonStore.store(agent, EASYPID_WALLET_SEED_CREDENTIAL_RECORD_ID, {
      seedCredential,
    }),

  update: async (agent: Agent, seedCredential: string) =>
    walletJsonStore.update(agent, EASYPID_WALLET_SEED_CREDENTIAL_RECORD_ID, {
      seedCredential,
    }),

  getById: async (agent: Agent) =>
    walletJsonStore.getById<{ seedCredential: string }>(agent, EASYPID_WALLET_SEED_CREDENTIAL_RECORD_ID),
}
