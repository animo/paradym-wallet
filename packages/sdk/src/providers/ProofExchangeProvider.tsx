import type { DidCommProofState } from '@credo-ts/didcomm'
import { DidCommProofExchangeRecord } from '@credo-ts/didcomm'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { DidCommAgent } from '../agent'
import type { RecordsState } from '../utils/records'
import {
  addRecord,
  recordsAddedByType,
  recordsRemovedByType,
  recordsUpdatedByType,
  removeRecord,
  updateRecord,
} from '../utils/records'

const ProofContext = createContext<RecordsState<DidCommProofExchangeRecord> | undefined>(undefined)

export const useProofs = () => {
  const proofContext = useContext(ProofContext)
  if (!proofContext) {
    throw new Error('useProofs must be used within a ProofContextProvider')
  }
  return proofContext
}

export const useProofsByConnectionId = (connectionId: string): DidCommProofExchangeRecord[] => {
  const { records: proofs } = useProofs()
  return useMemo(
    () => proofs.filter((proof: DidCommProofExchangeRecord) => proof.connectionId === connectionId),
    [proofs, connectionId]
  )
}

export const useProofById = (id: string): DidCommProofExchangeRecord | undefined => {
  const { records: proofs } = useProofs()
  return proofs.find((c: DidCommProofExchangeRecord) => c.id === id)
}

export const useProofByState = (state: DidCommProofState | DidCommProofState[]): DidCommProofExchangeRecord[] => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: proofs } = useProofs()

  const filteredProofs = useMemo(
    () => proofs.filter((r: DidCommProofExchangeRecord) => states.includes(r.state)),
    [proofs, states]
  )
  return filteredProofs
}

export const useProofNotInState = (state: DidCommProofState | DidCommProofState[]) => {
  const states = useMemo(() => (typeof state === 'string' ? [state] : state), [state])

  const { records: proofs } = useProofs()

  const filteredProofs = useMemo(
    () => proofs.filter((r: DidCommProofExchangeRecord) => !states.includes(r.state)),
    [proofs, states]
  )

  return filteredProofs
}

interface Props {
  agent: DidCommAgent
}

export const ProofExchangeProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<RecordsState<DidCommProofExchangeRecord>>({
    records: [],
    loading: true,
  })

  useEffect(() => {
    agent.didcomm.proofs.getAll().then((records) => setState({ records, loading: false }))
  }, [agent])

  useEffect(() => {
    if (state.loading) return

    const proofAdded$ = recordsAddedByType(agent, DidCommProofExchangeRecord).subscribe((record) =>
      setState(addRecord(record, state))
    )

    const proofUpdated$ = recordsUpdatedByType(agent, DidCommProofExchangeRecord).subscribe((record) =>
      setState(updateRecord(record, state))
    )

    const proofRemoved$ = recordsRemovedByType(agent, DidCommProofExchangeRecord).subscribe((record) =>
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
