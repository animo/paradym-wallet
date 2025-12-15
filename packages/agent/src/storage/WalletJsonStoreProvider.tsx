import type { GenericRecord } from '@credo-ts/core'
import {
  type Agent,
  type RecordDeletedEvent,
  type RecordSavedEvent,
  type RecordUpdatedEvent,
  RepositoryEventTypes,
} from '@credo-ts/core'
import { createContext, useContext, useEffect, useState } from 'react'

type WalletJsonStoreState = {
  jsonRecords: GenericRecord[]
  isLoading: boolean
}

const WalletJsonStoreContext = createContext<WalletJsonStoreState | undefined>(undefined)

export const useWalletJsonRecord = <T,>(id: string): { isLoading: boolean; record: T | undefined } => {
  const context = useContext(WalletJsonStoreContext)
  if (!context) {
    throw new Error('useWalletJsonRecord must be used within a WalletJsonStoreProvider')
  }

  const record = context.jsonRecords.find((r) => r.id === id)
  return {
    isLoading: context.isLoading,
    record: record?.content as T | undefined,
  }
}

interface Props {
  agent: Agent
  children: React.ReactNode
  recordIds: string[]
}

export const WalletJsonStoreProvider: React.FC<Props> = ({ agent, children, recordIds }) => {
  const [state, setState] = useState<WalletJsonStoreState>({
    jsonRecords: [],
    isLoading: true,
  })

  useEffect(() => {
    const fetchRecords = async () => {
      const records = await Promise.all(recordIds.map((id) => agent.genericRecords.findById(id)))
      const validRecords = records.filter((record): record is GenericRecord => record !== null)
      setState({ jsonRecords: validRecords, isLoading: false })
    }
    fetchRecords()
  }, [agent, recordIds])

  useEffect(() => {
    if (!state.isLoading) {
      const updateEvent = (event: RecordUpdatedEvent<GenericRecord>) => {
        if (recordIds.includes(event.payload.record.id)) {
          setState((prevState) => ({
            ...prevState,
            jsonRecords: prevState.jsonRecords.map((r) =>
              r.id === event.payload.record.id ? event.payload.record : r
            ),
          }))
        }
      }

      const addEvent = (event: RecordSavedEvent<GenericRecord>) => {
        if (recordIds.includes(event.payload.record.id)) {
          setState((prevState) => ({
            ...prevState,
            jsonRecords: [...prevState.jsonRecords, event.payload.record],
          }))
        }
      }

      const removeEvent = (event: RecordDeletedEvent<GenericRecord>) => {
        if (recordIds.includes(event.payload.record.id)) {
          setState((prevState) => ({
            ...prevState,
            jsonRecords: prevState.jsonRecords.filter((r) => r.id !== event.payload.record.id),
          }))
        }
      }

      agent.events.on<RecordUpdatedEvent<GenericRecord>>(RepositoryEventTypes.RecordUpdated, updateEvent)
      agent.events.on<RecordSavedEvent<GenericRecord>>(RepositoryEventTypes.RecordSaved, addEvent)
      agent.events.on<RecordDeletedEvent<GenericRecord>>(RepositoryEventTypes.RecordDeleted, removeEvent)

      return () => {
        agent.events.off(RepositoryEventTypes.RecordUpdated, updateEvent)
        agent.events.off(RepositoryEventTypes.RecordSaved, addEvent)
        agent.events.off(RepositoryEventTypes.RecordDeleted, removeEvent)
      }
    }
  }, [state.isLoading, agent, recordIds])

  return <WalletJsonStoreContext.Provider value={state}>{children}</WalletJsonStoreContext.Provider>
}
