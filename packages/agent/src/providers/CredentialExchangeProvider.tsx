import type { CredentialState } from '@credo-ts/didcomm'
import type { PropsWithChildren } from 'react'
import type { RecordsState } from './recordUtils'

import { CredentialExchangeRecord } from '@credo-ts/didcomm'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { FullAppAgent } from '../agent'
import {
  addRecord,
  recordsAddedByType,
  recordsRemovedByType,
  recordsUpdatedByType,
  removeRecord,
  updateRecord,
} from './recordUtils'

const CredentialContext = createContext<RecordsState<CredentialExchangeRecord> | undefined>(undefined)

export const useCredentials = () => {
  const credentialContext = useContext(CredentialContext)
  if (!credentialContext) {
    throw new Error('useCredentials must be used within a CredentialContextProvider')
  }
  return credentialContext
}

export const useCredentialsByConnectionId = (connectionId: string): CredentialExchangeRecord[] => {
  const { records: credentials } = useCredentials()
  return useMemo(
    () => credentials.filter((credential: CredentialExchangeRecord) => credential.connectionId === connectionId),
    [credentials, connectionId]
  )
}

export const useCredentialById = (id: string): CredentialExchangeRecord | undefined => {
  const { records: credentials } = useCredentials()
  return credentials.find((c: CredentialExchangeRecord) => c.id === id)
}

export const useCredentialByState = (state: CredentialState | CredentialState[]): CredentialExchangeRecord[] => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: credentials } = useCredentials()

  const filteredCredentials = useMemo(
    () => credentials.filter((r: CredentialExchangeRecord) => states.includes(r.state)),
    [credentials, states]
  )
  return filteredCredentials
}

export const useCredentialNotInState = (state: CredentialState | CredentialState[]) => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: credentials } = useCredentials()

  const filteredCredentials = useMemo(
    () => credentials.filter((r: CredentialExchangeRecord) => !states.includes(r.state)),
    [credentials, states]
  )

  return filteredCredentials
}

interface Props {
  agent: FullAppAgent
}

export const CredentialExchangeProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<RecordsState<CredentialExchangeRecord>>({
    records: [],
    loading: true,
  })

  useEffect(() => {
    agent.modules.credentials.getAll().then((records) => setState({ records, loading: false }))
  }, [agent])

  useEffect(() => {
    if (state.loading) return

    const credentialAdded$ = recordsAddedByType(agent, CredentialExchangeRecord).subscribe((record) =>
      setState(addRecord(record, state))
    )

    const credentialUpdated$ = recordsUpdatedByType(agent, CredentialExchangeRecord).subscribe((record) =>
      setState(updateRecord(record, state))
    )

    const credentialRemoved$ = recordsRemovedByType(agent, CredentialExchangeRecord).subscribe((record) =>
      setState(removeRecord(record, state))
    )

    return () => {
      credentialAdded$?.unsubscribe()
      credentialUpdated$?.unsubscribe()
      credentialRemoved$?.unsubscribe()
    }
  }, [state, agent])

  return <CredentialContext.Provider value={state}> {children} </CredentialContext.Provider>
}
