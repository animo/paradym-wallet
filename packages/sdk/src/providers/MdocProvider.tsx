import { MdocRecord } from '@credo-ts/core'
import type * as React from 'react'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useParadym } from '../hooks'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from '../utils/records'

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

export const MdocRecordProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const paradym = useParadym()

  const [state, setState] = useState<MdocRecordState>({
    mdocRecords: [],
    isLoading: true,
  })

  useEffect(() => {
    if (paradym.state !== 'unlocked') return

    void paradym.paradym.agent.mdoc.getAll().then((mdocRecords) => setState({ mdocRecords, isLoading: false }))
  }, [paradym])

  useEffect(() => {
    if (!state.isLoading && paradym.state === 'unlocked') {
      const credentialAdded$ = recordsAddedByType(paradym.paradym.agent, MdocRecord).subscribe((record) =>
        setState(addRecord(record, state))
      )

      const credentialUpdate$ = recordsUpdatedByType(paradym.paradym.agent, MdocRecord).subscribe((record) =>
        setState(updateRecord(record, state))
      )

      const credentialRemove$ = recordsRemovedByType(paradym.paradym.agent, MdocRecord).subscribe((record) =>
        setState(removeRecord(record, state))
      )

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, paradym])

  return <MdocRecordContext.Provider value={state}>{children}</MdocRecordContext.Provider>
}
