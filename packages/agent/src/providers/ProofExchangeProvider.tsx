import type { ProofState } from '@credo-ts/didcomm'
import type { PropsWithChildren } from 'react'
import type { RecordsState } from './recordUtils'

import { ProofExchangeRecord } from '@credo-ts/didcomm'
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

const ProofContext = createContext<RecordsState<ProofExchangeRecord> | undefined>(undefined)

export const useProofs = () => {
  const proofContext = useContext(ProofContext)
  if (!proofContext) {
    throw new Error('useProofs must be used within a ProofContextProvider')
  }
  return proofContext
}

export const useProofsByConnectionId = (connectionId: string): ProofExchangeRecord[] => {
  const { records: proofs } = useProofs()
  return useMemo(
    () => proofs.filter((proof: ProofExchangeRecord) => proof.connectionId === connectionId),
    [proofs, connectionId]
  )
}

export const useProofById = (id: string): ProofExchangeRecord | undefined => {
  const { records: proofs } = useProofs()
  return proofs.find((c: ProofExchangeRecord) => c.id === id)
}

export const useProofByState = (state: ProofState | ProofState[]): ProofExchangeRecord[] => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: proofs } = useProofs()

  const filteredProofs = useMemo(
    () => proofs.filter((r: ProofExchangeRecord) => states.includes(r.state)),
    [proofs, states]
  )
  return filteredProofs
}

export const useProofNotInState = (state: ProofState | ProofState[]) => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: proofs } = useProofs()

  const filteredProofs = useMemo(
    () => proofs.filter((r: ProofExchangeRecord) => !states.includes(r.state)),
    [proofs, states]
  )

  return filteredProofs
}

interface Props {
  agent: FullAppAgent
}

export const ProofExchangeProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<RecordsState<ProofExchangeRecord>>({
    records: [],
    loading: true,
  })

  useEffect(() => {
    agent.modules.proofs.getAll().then((records) => setState({ records, loading: false }))
  }, [agent])

  useEffect(() => {
    if (state.loading) return

    const proofAdded$ = recordsAddedByType(agent, ProofExchangeRecord).subscribe((record) =>
      setState(addRecord(record, state))
    )

    const proofUpdated$ = recordsUpdatedByType(agent, ProofExchangeRecord).subscribe((record) =>
      setState(updateRecord(record, state))
    )

    const proofRemoved$ = recordsRemovedByType(agent, ProofExchangeRecord).subscribe((record) =>
      setState(removeRecord(record, state))
    )

    return () => {
      proofAdded$?.unsubscribe()
      proofUpdated$?.unsubscribe()
      proofRemoved$?.unsubscribe()
    }
  }, [state, agent])

  return <ProofContext.Provider value={state}>{children}</ProofContext.Provider>
}
