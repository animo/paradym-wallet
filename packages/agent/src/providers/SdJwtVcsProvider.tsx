import { SdJwtVcRecord } from '@credo-ts/core'
import type * as React from 'react'
import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import type { EitherAgent } from '../agent'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from './recordUtils'

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
  agent: EitherAgent
}

export const SdJwtVcRecordProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<SdJwtVcRecordState>({
    sdJwtVcRecords: [],
    isLoading: true,
  })

  const fetchRecords = useCallback(async () => {
    const sdJwtVcRecords = await agent.sdJwtVc.getAll()
    setState({ sdJwtVcRecords, isLoading: false })
  }, [agent])

  useEffect(() => {
    void fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        void fetchRecords()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [fetchRecords])

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
