import { MdocRecord } from '@credo-ts/core'
import type * as React from 'react'
import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import type { EitherAgent } from '../agent'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from './recordUtils'

export { Mdoc, MdocRecord } from '@credo-ts/core'

type MdocRecordState = {
  mdocRecords: Array<MdocRecord>
  isLoading: boolean
}

const addRecord = (record: MdocRecord, state: MdocRecordState): MdocRecordState => {
  const newRecordsState = [...state.mdocRecords]
  newRecordsState.unshift(record)
  return {
    isLoading: state.isLoading,
    mdocRecords: newRecordsState,
  }
}

const updateRecord = (record: MdocRecord, state: MdocRecordState): MdocRecordState => {
  const newRecordsState = [...state.mdocRecords]
  const index = newRecordsState.findIndex((r) => r.id === record.id)
  if (index > -1) {
    newRecordsState[index] = record
  }
  return {
    isLoading: state.isLoading,
    mdocRecords: newRecordsState,
  }
}

const removeRecord = (record: MdocRecord, state: MdocRecordState): MdocRecordState => {
  const newRecordsState = state.mdocRecords.filter((r) => r.id !== record.id)
  return {
    isLoading: state.isLoading,
    mdocRecords: newRecordsState,
  }
}

const MdocRecordContext = createContext<MdocRecordState | undefined>(undefined)

export const useMdocRecords = (): MdocRecordState => {
  const mdocRecordContext = useContext(MdocRecordContext)
  if (!mdocRecordContext) {
    throw new Error('useMdocRecord must be used within a MdocRecordContextProvider')
  }

  return mdocRecordContext
}

export const useMdocRecordById = (id: string): MdocRecord | undefined => {
  const { mdocRecords } = useMdocRecords()
  return mdocRecords.find((c) => c.id === id)
}

interface Props {
  agent: EitherAgent
}

export const MdocRecordProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<MdocRecordState>({
    mdocRecords: [],
    isLoading: true,
  })

  const fetchRecords = useCallback(async () => {
    const mdocRecords = await agent.mdoc.getAll()
    setState({ mdocRecords, isLoading: false })
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
      const credentialAdded$ = recordsAddedByType(agent, MdocRecord).subscribe((record) =>
        setState(addRecord(record, state))
      )

      const credentialUpdate$ = recordsUpdatedByType(agent, MdocRecord).subscribe((record) =>
        setState(updateRecord(record, state))
      )

      const credentialRemove$ = recordsRemovedByType(agent, MdocRecord).subscribe((record) =>
        setState(removeRecord(record, state))
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, agent])

  return <MdocRecordContext.Provider value={state}>{children}</MdocRecordContext.Provider>
}
