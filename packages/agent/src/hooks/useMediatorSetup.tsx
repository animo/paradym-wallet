import { useEffect, useState } from 'react'
import type { ParadymAppAgent } from '../agent'
import { hasMediationConfigured, setupMediationWithDid, useMessagePickup } from '../mediation'

export function useMediatorSetup({
  agent,
  hasInternetConnection,
  mediatorDid,
}: {
  agent?: ParadymAppAgent
  hasInternetConnection: boolean
  mediatorDid?: string
}) {
  const [isSettingUpMediation, setIsSettingUpMediation] = useState(false)
  const [isMediationConfigured, setIsMediationConfigured] = useState(false)

  // Enable message pickup when mediation is configured and internet connection is available
  useMessagePickup({
    isEnabled: hasInternetConnection && isMediationConfigured,
    agent: agent as ParadymAppAgent,
  })

  useEffect(() => {
    if (!agent) return
    if (!hasInternetConnection || isMediationConfigured) return
    if (isSettingUpMediation) return

    setIsSettingUpMediation(true)

    agent.config.logger.debug('Checking if mediation is configured.')

    void hasMediationConfigured(agent)
      .then(async (mediationConfigured) => {
        if (!mediationConfigured) {
          agent.config.logger.debug('Mediation not configured yet.')
          if (!mediatorDid) throw new Error('No mediator did provided.')

          await setupMediationWithDid(agent, mediatorDid)
        }

        agent.config.logger.info("Mediation configured. You're ready to go!")
        setIsMediationConfigured(true)
      })
      .finally(() => {
        setIsSettingUpMediation(false)
      })
  }, [agent, isMediationConfigured, isSettingUpMediation, hasInternetConnection, mediatorDid])

  return { isMediationConfigured, isSettingUpMediation }
}
