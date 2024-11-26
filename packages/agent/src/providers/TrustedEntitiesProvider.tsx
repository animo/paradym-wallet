import { OpenId4VcSiopHolderService } from '@credo-ts/openid4vc'
import type { FullAppAgent } from 'packages/agent/src'
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'

export const TRUSTED_ENTITIES = [
  'https://funke.animo.id/siop/0193687b-0c27-7b82-a686-ff857dc6bbb3',
  'https://funke.animo.id/siop/0193687f-20d8-720a-9139-ed939ba510fa',
] satisfies [string, ...string[]]

type TrustedEntity = {
  entity_id: string
  organization_name: string
  logo_uri?: string
}

type TrustedEntitiesContextType = {
  trustedEntities: TrustedEntity[]
  isLoading: boolean
}

const TrustedEntitiesContext = createContext<TrustedEntitiesContextType | undefined>(undefined)

export function TrustedEntitiesProvider({ agent, children }: { agent: FullAppAgent; children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [trustedEntities, setTrustedEntities] = useState<TrustedEntity[]>([])

  useEffect(() => {
    async function fetchTrustedEntities() {
      try {
        const openId4VcSiopHolderService = agent.dependencyManager.resolve(OpenId4VcSiopHolderService)

        // Fetch configurations for all trusted entities
        const entityPromises = TRUSTED_ENTITIES.map((entityId) =>
          openId4VcSiopHolderService.fetchOpenIdFederationEntityConfiguration(agent.context, {
            entityId,
          })
        )
        const entitiesResults = await Promise.all(entityPromises)
        const entities = entitiesResults.map((result) => {
          return {
            entity_id: result.iss,
            organization_name: result.metadata?.federation_entity?.organization_name ?? 'Unknown entity',
            logo_uri: result.metadata?.federation_entity?.logo_uri,
          }
        })

        setTrustedEntities(entities)
      } catch (error) {
        console.error('Failed to fetch trusted entities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrustedEntities()
  }, [agent])

  return (
    <TrustedEntitiesContext.Provider value={{ trustedEntities, isLoading }}>{children}</TrustedEntitiesContext.Provider>
  )
}

export function useTrustedEntities() {
  const context = useContext(TrustedEntitiesContext)
  if (context === undefined) {
    throw new Error('useTrustedEntities must be used within a TrustedEntitiesProvider')
  }
  return context
}
