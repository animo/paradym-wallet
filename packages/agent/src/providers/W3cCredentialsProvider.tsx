import type { AppAgent } from '../agent'
import type { PropsWithChildren } from 'react'

import { W3cCredentialRecord } from '@aries-framework/core'
import {
  recordsAddedByType,
  recordsRemovedByType,
  recordsUpdatedByType,
} from '@aries-framework/react-hooks/build/recordUtils'
import { useState, createContext, useContext, useEffect } from 'react'
import * as React from 'react'

type W3cCredentialRecordState = {
  w3cCredentialRecords: Array<W3cCredentialRecord>
  loading: boolean
}

const addRecord = (
  record: W3cCredentialRecord,
  state: W3cCredentialRecordState
): W3cCredentialRecordState => {
  const newRecordsState = [...state.w3cCredentialRecords]
  newRecordsState.unshift(record)
  return {
    loading: state.loading,
    w3cCredentialRecords: newRecordsState,
  }
}

const updateRecord = (
  record: W3cCredentialRecord,
  state: W3cCredentialRecordState
): W3cCredentialRecordState => {
  const newRecordsState = [...state.w3cCredentialRecords]
  const index = newRecordsState.findIndex((r) => r.id === record.id)
  if (index > -1) {
    newRecordsState[index] = record
  }
  return {
    loading: state.loading,
    w3cCredentialRecords: newRecordsState,
  }
}

const removeRecord = (
  record: W3cCredentialRecord,
  state: W3cCredentialRecordState
): W3cCredentialRecordState => {
  const newRecordsState = state.w3cCredentialRecords.filter((r) => r.id !== record.id)
  return {
    loading: state.loading,
    w3cCredentialRecords: newRecordsState,
  }
}

const W3cCredentialRecordContext = createContext<W3cCredentialRecordState | undefined>(undefined)

export const useW3cCredentialRecords = () => {
  const anonCredsCredentialDefinitionContext = useContext(W3cCredentialRecordContext)
  if (!anonCredsCredentialDefinitionContext) {
    throw new Error(
      'useW3cCredentialRecord must be used within a W3cCredentialRecordContextProvider'
    )
  }
  return anonCredsCredentialDefinitionContext
}

export const useW3cCredentialRecordById = (id: string): W3cCredentialRecord | undefined => {
  const { w3cCredentialRecords } = useW3cCredentialRecords()
  return w3cCredentialRecords.find((c) => c.id === id)
}

interface Props {
  agent: AppAgent
}

export const W3cCredentialRecordProvider: React.FC<PropsWithChildren<Props>> = ({
  agent,
  children,
}) => {
  const [state, setState] = useState<W3cCredentialRecordState>({
    w3cCredentialRecords: [],
    loading: true,
  })

  useEffect(() => {
    void agent.w3cCredentials
      .getAllCredentialRecords()
      .then((w3cCredentialRecords) => setState({ w3cCredentialRecords, loading: false }))
  }, [])

  useEffect(() => {
    if (!state.loading && agent) {
      const credentialAdded$ = recordsAddedByType(agent, W3cCredentialRecord).subscribe((record) =>
        setState(addRecord(record, state))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, W3cCredentialRecord).subscribe(
        (record) => setState(updateRecord(record, state))
      )

      const credentialRemove$ = recordsRemovedByType(agent, W3cCredentialRecord).subscribe(
        (record) => setState(removeRecord(record, state))
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, agent])

  return (
    <W3cCredentialRecordContext.Provider value={state}>
      {children}
    </W3cCredentialRecordContext.Provider>
  )
}
