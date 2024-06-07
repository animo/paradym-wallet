import type { FullAppAgent } from '../agent'
import type { PropsWithChildren } from 'react'

import { SdJwtVcRecord } from '@credo-ts/core'
import {
  recordsAddedByType,
  recordsRemovedByType,
  recordsUpdatedByType,
} from '@credo-ts/react-hooks/build/recordUtils'
import { useState, createContext, useContext, useEffect } from 'react'
import * as React from 'react'

export { SdJwtVc, SdJwtVcRecord } from '@credo-ts/core'

type SdJwtVcRecordState = {
  sdJwtVcRecords: Array<SdJwtVcRecord>
  isLoading: boolean
}

const addRecord = (record: SdJwtVcRecord, state: SdJwtVcRecordState): SdJwtVcRecordState => {
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
  agent: FullAppAgent
}

export const SdJwtVcRecordProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<SdJwtVcRecordState>({
    sdJwtVcRecords: [],
    isLoading: true,
  })

  useEffect(() => {
    void agent.sdJwtVc
      .getAll()
      .then((sdJwtVcRecords) => setState({ sdJwtVcRecords, isLoading: false }))
  }, [])

  useEffect(() => {
    if (!state.isLoading && agent) {
      const credentialAdded$ = recordsAddedByType(agent, SdJwtVcRecord).subscribe((record) =>
        setState(addRecord(record, state))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, SdJwtVcRecord).subscribe((record) =>
        setState(updateRecord(record, state))
      )

      const credentialRemove$ = recordsRemovedByType(agent, SdJwtVcRecord).subscribe((record) =>
        setState(removeRecord(record, state))
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, agent])

  return <SdJwtVcRecordContext.Provider value={state}>{children}</SdJwtVcRecordContext.Provider>
}
