import { AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID } from '@ausweis/constants'
import { type Agent, TypedArrayEncoder } from '@credo-ts/core'
import { GenericRecord } from '@credo-ts/core/build/modules/generic-records/repository/GenericRecord'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from '@credo-ts/react-hooks/build/recordUtils'
import { type AusweisAppAgent, walletJsonStore } from '@package/agent'
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

export const seedCredentialStorage = {
  store: async (agent: Agent, seedCredential: string) =>
    walletJsonStore.store(agent, AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID, {
      seedCredential,
    }),

  update: async (agent: Agent, seedCredential: string) =>
    walletJsonStore.update(agent, AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID, {
      seedCredential,
    }),

  get: async (agent: Agent) =>
    walletJsonStore.getById<{ seedCredential: string }>(agent, AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID),
}

type SeedCredentialState = {
  seedCredential: string | undefined
  isLoading: boolean
}

export interface SeedCredentialPidData {
  iat: number
  pid_data: {
    place_of_birth: { locality: string }
    birthdate: string
    address: {
      street_address: string
      country: string
      locality: string
      postal_code: string
    }
    birth_family_name: string
    nationality: string
    given_name: string
    family_name: string
  }
}

type SeedCredentialStatePidData = {
  seedCredential: SeedCredentialPidData | undefined
  isLoading: boolean
}

const updateSeedCredential = (seedCredential: string, state: SeedCredentialState): SeedCredentialState => {
  return {
    isLoading: state.isLoading,
    seedCredential,
  }
}

const addSeedCredential = (seedCredential: string, state: SeedCredentialState): SeedCredentialState => {
  return {
    isLoading: state.isLoading,
    seedCredential,
  }
}

const removeSeedCredential = (state: SeedCredentialState): SeedCredentialState => {
  return {
    isLoading: state.isLoading,
    seedCredential: undefined,
  }
}

const SeedCredentialContext = createContext<SeedCredentialState | undefined>(undefined)

export const useSeedCredential = (): SeedCredentialState => {
  const seedCredentialContext = useContext(SeedCredentialContext)
  if (!seedCredentialContext) {
    throw new Error('useSeedCredential  must be used within a SeedCredentialProvider')
  }

  return seedCredentialContext
}

export const useSeedCredentialPidData = (): SeedCredentialStatePidData => {
  const seedCredentialContext = useContext(SeedCredentialContext)
  if (!seedCredentialContext) {
    throw new Error('useSeedCredential  must be used within a SeedCredentialProvider')
  }

  if (!seedCredentialContext.seedCredential) {
    // We can cast here as it is undefined
    return seedCredentialContext as SeedCredentialStatePidData
  }

  const payload = seedCredentialContext.seedCredential.split('.')[1]
  const parsedPayload = JSON.parse(TypedArrayEncoder.fromBase64(payload).toString()) as SeedCredentialPidData

  return {
    isLoading: seedCredentialContext.isLoading,
    seedCredential: parsedPayload,
  }
}

interface Props {
  agent: AusweisAppAgent
}

export const SeedCredentialProvider: React.FC<PropsWithChildren<Props>> = ({ agent, children }) => {
  const [state, setState] = useState<SeedCredentialState>({
    seedCredential: undefined,
    isLoading: true,
  })

  useEffect(() => {
    void seedCredentialStorage.get(agent).then((record) => {
      setState({ seedCredential: record?.seedCredential, isLoading: false })
    })
  }, [agent])

  useEffect(() => {
    if (!state.isLoading && agent) {
      const credentialAdded$ = recordsAddedByType(agent, GenericRecord).subscribe((record) => {
        if (record.id !== AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID) return

        const seedCredential = record.content.seedCredential as string
        setState(addSeedCredential(seedCredential, state))
      })

      const credentialUpdate$ = recordsUpdatedByType(agent, GenericRecord).subscribe((record) => {
        if (record.id !== AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID) return

        const seedCredential = record.content.seedCredential as string
        setState(updateSeedCredential(seedCredential, state))
      })

      const credentialRemove$ = recordsRemovedByType(agent, GenericRecord).subscribe((record) => {
        if (record.id !== AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID) return
        setState(removeSeedCredential(state))
      })

      return () => {
        credentialAdded$.unsubscribe()
        credentialUpdate$.unsubscribe()
        credentialRemove$.unsubscribe()
      }
    }
  }, [state, agent])

  return <SeedCredentialContext.Provider value={state}>{children}</SeedCredentialContext.Provider>
}
