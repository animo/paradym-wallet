import { CredoWebCrypto, TypedArrayEncoder } from '@credo-ts/core'
import type { EasyPIDAppAgent } from '@package/agent'

const GENERIC_RECORD_SALT_ID = 'GENERIC_RECORD_SALT_ID'

export const createSalt = async (agent: EasyPIDAppAgent) => {
  const maybeSalt = await getSalt(agent)
  if (maybeSalt) return maybeSalt

  const crypto = new CredoWebCrypto(agent.context)

  const saltBytes = crypto.getRandomValues(new Uint8Array(12))
  const saltString = TypedArrayEncoder.toBase64URL(saltBytes)
  await agent.genericRecords.save({ content: { salt: saltString }, id: GENERIC_RECORD_SALT_ID })
  return saltString
}

const getSalt = async (agent: EasyPIDAppAgent): Promise<string | null> => {
  return (await agent.genericRecords.findById(GENERIC_RECORD_SALT_ID))?.content.salt as string
}

export const getOrCreateSalt = async (agent: EasyPIDAppAgent) => {
  const maybeSalt = await getSalt(agent)
  return maybeSalt ?? (await createSalt(agent))
}
