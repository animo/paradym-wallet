import { MdocRecord } from '@credo-ts/core'
import type * as React from 'react'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import type { AnyAgent } from '../agent'
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

export const MdocRecordProvider: React.FC<PropsWithChildren<{ agent: AnyAgent }>> = ({ agent, children }) => {
  const [state, setState] = useState<MdocRecordState>({
    mdocRecords: [],
    isLoading: true,
  })

  // The agent rather than the unlock state: `useParadym` returns a new object on every render of
  // the unlock provider, which re-read every mdoc from the store and replaced the whole array with
  // freshly decoded records — invalidating everything derived from them.
  useEffect(() => {
    void agent.mdoc.getAll().then((mdocRecords) => setState({ mdocRecords, isLoading: false }))
  }, [agent])

  useEffect(() => {
    const credentialAdded$ = recordsAddedByType(agent, MdocRecord).subscribe((record) =>
      setState((state) => addRecord(record, state))
    )

    const credentialUpdate$ = recordsUpdatedByType(agent, MdocRecord).subscribe((record) =>
      setState((state) => updateRecord(record, state))
    )

    const credentialRemove$ = recordsRemovedByType(agent, MdocRecord).subscribe((record) =>
      setState((state) => removeRecord(record, state))
    )

    return () => {
      credentialAdded$.unsubscribe()
      credentialUpdate$.unsubscribe()
      credentialRemove$.unsubscribe()
    }
  }, [agent])

  return <MdocRecordContext.Provider value={state}>{children}</MdocRecordContext.Provider>
}
