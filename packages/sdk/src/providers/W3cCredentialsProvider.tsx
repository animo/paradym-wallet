import { type Agent, W3cCredentialRecord } from '@credo-ts/core'
import type * as React from 'react'
import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { subscribeToCredentialStoreChanges } from '../storage/credentials'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from '../utils/records'
import { useReloadOnAppActive } from './useReloadOnAppActive'

export { W3cCredentialRecord, W3cVerifiableCredential } from '@credo-ts/core'

type W3cCredentialRecordState = {
  w3cCredentialRecords: Array<W3cCredentialRecord>
  isLoading: boolean
}

const addRecord = (record: W3cCredentialRecord, state: W3cCredentialRecordState): W3cCredentialRecordState => {
  if (state.w3cCredentialRecords.some((r) => r.id === record.id)) return updateRecord(record, state)

  const newRecordsState = [...state.w3cCredentialRecords]
  newRecordsState.unshift(record)
  return {
    isLoading: state.isLoading,
    w3cCredentialRecords: newRecordsState,
  }
}

const updateRecord = (record: W3cCredentialRecord, state: W3cCredentialRecordState): W3cCredentialRecordState => {
  const newRecordsState = [...state.w3cCredentialRecords]
  const index = newRecordsState.findIndex((r) => r.id === record.id)
  if (index > -1) {
    newRecordsState[index] = record
  }
  return {
    isLoading: state.isLoading,
    w3cCredentialRecords: newRecordsState,
  }
}

const removeRecord = (record: W3cCredentialRecord, state: W3cCredentialRecordState): W3cCredentialRecordState => {
  const newRecordsState = state.w3cCredentialRecords.filter((r) => r.id !== record.id)
  return {
    isLoading: state.isLoading,
    w3cCredentialRecords: newRecordsState,
  }
}

const W3cCredentialRecordContext = createContext<W3cCredentialRecordState | undefined>(undefined)

export const useW3cCredentialRecords = (): W3cCredentialRecordState => {
  const w3cCredentialRecordContext = useContext(W3cCredentialRecordContext)
  if (!w3cCredentialRecordContext) {
    throw new Error('useW3cCredentialRecord must be used within a W3cCredentialRecordContextProvider')
  }

  return w3cCredentialRecordContext
}

export const useW3cCredentialRecordById = (id: string): W3cCredentialRecord | undefined => {
  const { w3cCredentialRecords } = useW3cCredentialRecords()
  return w3cCredentialRecords.find((c) => c.id === id)
}

interface Props {
  agent: Agent
}

export const W3cCredentialRecordProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<W3cCredentialRecordState>({
    w3cCredentialRecords: [],
    isLoading: true,
  })

  const loadRecords = useCallback(() => {
    void agent.w3cCredentials
      .getAll()
      .then((w3cCredentialRecords) => setState({ w3cCredentialRecords, isLoading: false }))
  }, [agent])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])
  useReloadOnAppActive(loadRecords)

  useEffect(() => {
    if (agent) {
      const unsubscribeCredentialStore = subscribeToCredentialStoreChanges(loadRecords)

      if (state.isLoading) return unsubscribeCredentialStore

      const credentialAdded$ = recordsAddedByType(agent, W3cCredentialRecord).subscribe((record) =>
        setState((currentState) => addRecord(record, currentState))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, W3cCredentialRecord).subscribe((record) =>
        setState((currentState) => updateRecord(record, currentState))
      )

      const credentialRemove$ = recordsRemovedByType(agent, W3cCredentialRecord).subscribe((record) =>
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

  return <W3cCredentialRecordContext.Provider value={state}>{children}</W3cCredentialRecordContext.Provider>
}
