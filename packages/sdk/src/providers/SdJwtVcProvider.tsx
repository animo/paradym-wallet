import { type Agent, SdJwtVcRecord } from '@credo-ts/core'
import type * as React from 'react'
import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { subscribeToCredentialStoreChanges } from '../storage/credentials'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from '../utils/records'
import { useReloadOnAppActive } from './useReloadOnAppActive'

export { SdJwtVc, SdJwtVcRecord } from '@credo-ts/core'

type SdJwtVcRecordState = {
  sdJwtVcRecords: Array<SdJwtVcRecord>
  isLoading: boolean
}

const addRecord = (record: SdJwtVcRecord, state: SdJwtVcRecordState): SdJwtVcRecordState => {
  if (state.sdJwtVcRecords.some((r) => r.id === record.id)) return updateRecord(record, state)

  const newRecordsState = [...state.sdJwtVcRecords]
  newRecordsState.unshift(record)
  return {
    isLoading: state.isLoading,
    sdJwtVcRecords: newRecordsState,
  }
}

const updateRecord = (record: SdJwtVcRecord, state: SdJwtVcRecordState): SdJwtVcRecordState => {
  const newRecordsState = [...state.sdJwtVcRecords]
  const index = newRecordsState.findIndex((r) => r.id === record.id)
  if (index > -1) {
    newRecordsState[index] = record
  }
  return {
    isLoading: state.isLoading,
    sdJwtVcRecords: newRecordsState,
  }
}

const removeRecord = (record: SdJwtVcRecord, state: SdJwtVcRecordState): SdJwtVcRecordState => {
  const newRecordsState = state.sdJwtVcRecords.filter((r) => r.id !== record.id)
  return {
    isLoading: state.isLoading,
    sdJwtVcRecords: newRecordsState,
  }
}

const SdJwtVcRecordContext = createContext<SdJwtVcRecordState | undefined>(undefined)

export const useSdJwtVcRecords = (): SdJwtVcRecordState => {
  const sdJwtVcRecordContext = useContext(SdJwtVcRecordContext)
  if (!sdJwtVcRecordContext) {
    throw new Error('useSdJwtVcRecord must be used within a SdJwtVcRecordContextProvider')
  }

  return sdJwtVcRecordContext
}

export const useSdJwtVcRecordById = (id: string): SdJwtVcRecord | undefined => {
  const { sdJwtVcRecords } = useSdJwtVcRecords()
  return sdJwtVcRecords.find((c) => c.id === id)
}

interface Props {
  agent: Agent
}

export const SdJwtVcRecordProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<SdJwtVcRecordState>({
    sdJwtVcRecords: [],
    isLoading: true,
  })

  const loadRecords = useCallback(() => {
    void agent.sdJwtVc.getAll().then((sdJwtVcRecords) => setState({ sdJwtVcRecords, isLoading: false }))
  }, [agent])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])
  useReloadOnAppActive(loadRecords)

  useEffect(() => {
    if (agent) {
      const unsubscribeCredentialStore = subscribeToCredentialStoreChanges(loadRecords)

      if (state.isLoading) return unsubscribeCredentialStore

      const credentialAdded$ = recordsAddedByType(agent, SdJwtVcRecord).subscribe((record) =>
        setState((currentState) => addRecord(record, currentState))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, SdJwtVcRecord).subscribe((record) =>
        setState((currentState) => updateRecord(record, currentState))
      )

      const credentialRemove$ = recordsRemovedByType(agent, SdJwtVcRecord).subscribe((record) =>
        setState((currentState) => removeRecord(record, currentState))
      )

      return () => {
        unsubscribeCredentialStore()
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state.isLoading, agent, loadRecords])

  return <SdJwtVcRecordContext.Provider value={state}>{children}</SdJwtVcRecordContext.Provider>
}
