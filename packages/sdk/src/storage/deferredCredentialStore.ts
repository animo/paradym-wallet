import { type Kms, utils } from '@credo-ts/core'
import type {
  OpenId4VciDeferredCredentialResponse,
  OpenId4VciMetadata,
  OpenId4VciRequestTokenResponse,
} from '@credo-ts/openid4vc'
import { useMemo } from 'react'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { useWalletJsonRecord } from '../providers/WalletJsonStoreProvider'
import { getWalletJsonStore } from './walletJsonStore'

export type DeferredCredential = {
  id: string
  createdAt: string
  lastCheckedAt: string
  lastErroredAt?: string
  clientId?: string
  response: OpenId4VciDeferredCredentialResponse
  issuerMetadata: OpenId4VciMetadata
  accessToken: Omit<OpenId4VciRequestTokenResponse, 'dpop'> & {
    dpop?: Omit<NonNullable<OpenId4VciRequestTokenResponse['dpop']>, 'jwk'> & {
      jwk: Kms.PublicJwk['jwk']
    }
  }
}

export type DeferredCredentialBefore = Omit<DeferredCredential, 'id' | 'createdAt' | 'lastCheckedAt'>

type DeferredCredentialRecord = {
  deferredCredentials: DeferredCredential[]
}

const _deferredCredentialStorage = getWalletJsonStore<DeferredCredentialRecord>(
  'PARADYM_OID4VCI_DEFERRED_CREDENTIAL_RECORD'
)
export const deferredCredentialStorage = {
  recordId: _deferredCredentialStorage.recordId,
  addDeferredCredential: async (paradym: ParadymWalletSdk, deferredCredential: DeferredCredential) => {
    const record = await _deferredCredentialStorage.get(paradym.agent)
    if (!record) {
      await _deferredCredentialStorage.store(paradym.agent, {
        deferredCredentials: [deferredCredential],
      })
    } else {
      record.deferredCredentials.push(deferredCredential)
      await _deferredCredentialStorage.update(paradym.agent, record)
    }
    return deferredCredential
  },
  updateDeferredCredential: async (
    paradym: ParadymWalletSdk,
    updatedDeferredCredential: Partial<DeferredCredential> & Pick<DeferredCredential, 'id'>
  ) => {
    const record = await _deferredCredentialStorage.get(paradym.agent)
    if (!record) {
      throw new Error('No deferred credential record found')
    }

    const deferredCredential = record.deferredCredentials.findIndex((d) => d.id === updatedDeferredCredential.id)
    if (deferredCredential === -1) {
      throw new Error(`Deferred credential with id ${updatedDeferredCredential.id} not found`)
    }

    record.deferredCredentials[deferredCredential] = {
      ...record.deferredCredentials[deferredCredential],
      ...updatedDeferredCredential,
    }

    await _deferredCredentialStorage.update(paradym.agent, record)
    return updatedDeferredCredential
  },
  deleteDeferredCredential: async (paradym: ParadymWalletSdk, id: string) => {
    const record = await _deferredCredentialStorage.get(paradym.agent)
    if (!record) {
      throw new Error('No deferred credential record found')
    }

    record.deferredCredentials = record.deferredCredentials.filter((d) => d.id !== id)
    await _deferredCredentialStorage.update(paradym.agent, record)
  },
}

export const useDeferredCredentials = () => {
  const { record, isLoading } = useWalletJsonRecord<DeferredCredentialRecord>(deferredCredentialStorage.recordId)

  const deferredCredentials = useMemo(() => {
    if (!record?.deferredCredentials) return []

    return [...record.deferredCredentials].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [record?.deferredCredentials])

  return {
    deferredCredentials,
    isLoading,
  }
}

export const storeDeferredCredential = async (paradym: ParadymWalletSdk, input: DeferredCredentialBefore) => {
  return await deferredCredentialStorage.addDeferredCredential(paradym, {
    id: utils.uuid(),
    createdAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    response: input.response,
    issuerMetadata: input.issuerMetadata,
    accessToken: input.accessToken,
    clientId: input.clientId,
  })
}

export const updateDeferredCredential = async (
  paradym: ParadymWalletSdk,
  input: Partial<Omit<DeferredCredential, 'createdAt'>> & Pick<DeferredCredential, 'id'>
) => {
  return await deferredCredentialStorage.updateDeferredCredential(paradym, input)
}

export const deleteDeferredCredential = async (paradym: ParadymWalletSdk, id: string) => {
  await deferredCredentialStorage.deleteDeferredCredential(paradym, id)
}

export const getDeferredCredentialNextCheckAt = (deferredCredential: DeferredCredential) => {
  return deferredCredential.response.interval
    ? new Date(new Date(deferredCredential.lastCheckedAt).getTime() + deferredCredential.response.interval * 1000)
    : undefined
}
