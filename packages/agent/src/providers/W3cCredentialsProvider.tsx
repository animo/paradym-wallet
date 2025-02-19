import type { PropsWithChildren } from 'react'
import type { EitherAgent } from '../agent'

import { W3cCredentialRecord } from '@credo-ts/core'
import { createContext, useContext, useEffect, useState } from 'react'
import type * as React from 'react'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from './recordUtils'

export { W3cCredentialRecord, W3cVerifiableCredential } from '@credo-ts/core'

type W3cCredentialRecordState = {
  w3cCredentialRecords: Array<W3cCredentialRecord>
  isLoading: boolean
}

const addRecord = (record: W3cCredentialRecord, state: W3cCredentialRecordState): W3cCredentialRecordState => {
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
  agent: EitherAgent
}

export const W3cCredentialRecordProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<W3cCredentialRecordState>({
    w3cCredentialRecords: [],
    isLoading: true,
  })

  useEffect(() => {
    void agent.w3cCredentials
      .getAllCredentialRecords()
      .then((w3cCredentialRecords) => setState({ w3cCredentialRecords, isLoading: false }))
  }, [agent])

  useEffect(() => {
    if (!state.isLoading && agent) {
      const credentialAdded$ = recordsAddedByType(agent, W3cCredentialRecord).subscribe((record) =>
        setState(addRecord(record, state))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, W3cCredentialRecord).subscribe((record) =>
        setState(updateRecord(record, state))
      )

      const credentialRemove$ = recordsRemovedByType(agent, W3cCredentialRecord).subscribe((record) =>
        setState(removeRecord(record, state))
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, agent])

  return <W3cCredentialRecordContext.Provider value={state}>{children}</W3cCredentialRecordContext.Provider>
}
