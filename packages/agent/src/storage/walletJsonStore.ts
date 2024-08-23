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

const getById = async <T extends Record<string, unknown>>(agent: Agent, id: string): Promise<T | undefined> => {
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
