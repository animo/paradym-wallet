import type { Agent } from '@credo-ts/core'
import { GenericRecord } from '@credo-ts/core/build/modules/generic-records/repository/GenericRecord'

const store = async (agent: Agent, id: string, value: Record<string, unknown>) => {
  const record = new GenericRecord({ id, content: value })
  await agent.genericRecords.save(record)
}

const update = async (agent: Agent, id: string, value: Record<string, unknown>) => {
  const record = new GenericRecord({ id, content: value })
  await agent.genericRecords.update(record)
}

const getById = async <T>(agent: Agent, id: string): Promise<T | undefined> => {
  const record = await agent.genericRecords.findById(id)

  if (!record) {
    return undefined
  }

  return record.content as T
}

export const walletJsonStore = {
  store,
  getById,
  update,
}

export function getWalletJsonStore<Content extends Record<string, unknown>>(recordId: string) {
  return {
    recordId,
    store: async (agent: Agent, content: Content) => walletJsonStore.store(agent, recordId, content),
    update: async (agent: Agent, content: Content) => walletJsonStore.update(agent, recordId, content),
    get: async (agent: Agent) => walletJsonStore.getById<Content>(agent, recordId),
  }
}
