import { W3cV2CredentialRecord } from '@credo-ts/core'
import type * as React from 'react'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import type { EitherAgent } from '../agent'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from './recordUtils'

export { W3cV2CredentialRecord, W3cV2VerifiableCredential } from '@credo-ts/core'

type W3cV2CredentialRecordState = {
  w3cV2CredentialRecords: Array<W3cV2CredentialRecord>
  isLoading: boolean
}

const addRecord = (record: W3cV2CredentialRecord, state: W3cV2CredentialRecordState): W3cV2CredentialRecordState => {
  const newRecordsState = [...state.w3cV2CredentialRecords]
  newRecordsState.unshift(record)
  return {
    isLoading: state.isLoading,
    w3cV2CredentialRecords: newRecordsState,
  }
}

const updateRecord = (record: W3cV2CredentialRecord, state: W3cV2CredentialRecordState): W3cV2CredentialRecordState => {
  const newRecordsState = [...state.w3cV2CredentialRecords]
  const index = newRecordsState.findIndex((r) => r.id === record.id)
  if (index > -1) {
    newRecordsState[index] = record
  }
  return {
    isLoading: state.isLoading,
    w3cV2CredentialRecords: newRecordsState,
  }
}

const removeRecord = (record: W3cV2CredentialRecord, state: W3cV2CredentialRecordState): W3cV2CredentialRecordState => {
  const newRecordsState = state.w3cV2CredentialRecords.filter((r) => r.id !== record.id)
  return {
    isLoading: state.isLoading,
    w3cV2CredentialRecords: newRecordsState,
  }
}

const W3cV2CredentialRecordContext = createContext<W3cV2CredentialRecordState | undefined>(undefined)

export const useW3cV2CredentialRecords = (): W3cV2CredentialRecordState => {
  const w3cV2CredentialRecordContext = useContext(W3cV2CredentialRecordContext)
  if (!w3cV2CredentialRecordContext) {
    throw new Error('useW3cV2CredentialRecord must be used within a W3cV2CredentialRecordContextProvider')
  }

  return w3cV2CredentialRecordContext
}

export const useW3cV2CredentialRecordById = (id: string): W3cV2CredentialRecord | undefined => {
  const { w3cV2CredentialRecords } = useW3cV2CredentialRecords()
  return w3cV2CredentialRecords.find((c) => c.id === id)
}

interface Props {
  agent: EitherAgent
}

export const W3cV2CredentialRecordProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<W3cV2CredentialRecordState>({
    w3cV2CredentialRecords: [],
    isLoading: true,
  })

  useEffect(() => {
    void agent.w3cV2Credentials
      .getAll()
      .then((w3cV2CredentialRecords) => setState({ w3cV2CredentialRecords, isLoading: false }))
  }, [agent])

  useEffect(() => {
    if (!state.isLoading && agent) {
      const credentialAdded$ = recordsAddedByType(agent, W3cV2CredentialRecord).subscribe((record) =>
        setState(addRecord(record, state))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, W3cV2CredentialRecord).subscribe((record) =>
        setState(updateRecord(record, state))
      )

      const credentialRemove$ = recordsRemovedByType(agent, W3cV2CredentialRecord).subscribe((record) =>
        setState(removeRecord(record, state))
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, agent])

  return <W3cV2CredentialRecordContext.Provider value={state}>{children}</W3cV2CredentialRecordContext.Provider>
}
