import type { DidCommCredentialState } from '@credo-ts/didcomm'
import { DidCommCredentialExchangeRecord } from '@credo-ts/didcomm'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ParadymAppAgent } from '../agent'
import type { RecordsState } from './recordUtils'
import {
  addRecord,
  recordsAddedByType,
  recordsRemovedByType,
  recordsUpdatedByType,
  removeRecord,
  updateRecord,
} from './recordUtils'

const CredentialContext = createContext<RecordsState<DidCommCredentialExchangeRecord> | undefined>(undefined)

export const useCredentials = () => {
  const credentialContext = useContext(CredentialContext)
  if (!credentialContext) {
    throw new Error('useCredentials must be used within a CredentialContextProvider')
  }
  return credentialContext
}

export const useCredentialsByConnectionId = (connectionId: string): DidCommCredentialExchangeRecord[] => {
  const { records: credentials } = useCredentials()
  return useMemo(
    () => credentials.filter((credential: DidCommCredentialExchangeRecord) => credential.connectionId === connectionId),
    [credentials, connectionId]
  )
}

export const useCredentialById = (id: string): DidCommCredentialExchangeRecord | undefined => {
  const { records: credentials } = useCredentials()
  return credentials.find((c: DidCommCredentialExchangeRecord) => c.id === id)
}

export const useCredentialByState = (
  state: DidCommCredentialState | DidCommCredentialState[]
): DidCommCredentialExchangeRecord[] => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: credentials } = useCredentials()

  const filteredCredentials = useMemo(
    () => credentials.filter((r: DidCommCredentialExchangeRecord) => states.includes(r.state)),
    [credentials, states]
  )
  return filteredCredentials
}

export const useCredentialNotInState = (state: DidCommCredentialState | DidCommCredentialState[]) => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: credentials } = useCredentials()

  const filteredCredentials = useMemo(
    () => credentials.filter((r: DidCommCredentialExchangeRecord) => !states.includes(r.state)),
    [credentials, states]
  )

  return filteredCredentials
}

interface Props {
  agent: ParadymAppAgent
}

export const CredentialExchangeProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<RecordsState<DidCommCredentialExchangeRecord>>({
    records: [],
    loading: true,
  })

  useEffect(() => {
    agent.didcomm.credentials.getAll().then((records) => setState({ records, loading: false }))
  }, [agent])

  useEffect(() => {
    if (state.loading) return

    const credentialAdded$ = recordsAddedByType(agent, DidCommCredentialExchangeRecord).subscribe((record) =>
      setState(addRecord(record, state))
    )

    const credentialUpdated$ = recordsUpdatedByType(agent, DidCommCredentialExchangeRecord).subscribe((record) =>
      setState(updateRecord(record, state))
    )

    const credentialRemoved$ = recordsRemovedByType(agent, DidCommCredentialExchangeRecord).subscribe((record) =>
      setState(removeRecord(record, state))
    )

    return () => {
      credentialAdded$?.unsubscribe()
      credentialUpdated$?.unsubscribe()
      credentialRemoved$?.unsubscribe()
    }
  }, [state, agent])

  return <CredentialContext.Provider value={state}>{children}</CredentialContext.Provider>
}
