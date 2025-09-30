import { useAppAgent } from '@easypid/agent'
import { useEffect, useState } from 'react'
import { fetchAndProcessDeferredCredentials } from '../openid4vc/deferredCredentialRecord'
import { useDeferredCredentials } from '../storage/deferredCredentialStore'

export const useRefreshedDeferredCredentials = () => {
  const { agent, loading: isLoadingAgent } = useAppAgent()
  const { deferredCredentials, isLoading: isLoadingDeferredCredentials } = useDeferredCredentials()
  const [refreshedDeferredCredentials, setRefreshedDeferredCredentials] = useState(false)

  useEffect(() => {
    if (isLoadingDeferredCredentials || isLoadingAgent || refreshedDeferredCredentials) return
    agent.config.logger.debug('Refreshing deferred credentials')

    setRefreshedDeferredCredentials(true)

    fetchAndProcessDeferredCredentials(agent, deferredCredentials).finally(() => {
      agent.config.logger.debug('Finished refreshing deferred credentials')
    })
  }, [isLoadingAgent, agent, refreshedDeferredCredentials, isLoadingDeferredCredentials, deferredCredentials])
}
