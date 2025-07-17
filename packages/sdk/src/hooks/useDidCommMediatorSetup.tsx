import { useEffect, useState } from 'react'
import type { DidCommAgent } from '../agent'
import { hasMediationConfigured, setupMediationWithDid } from '../didcomm/mediation'
import { ParadymWalletNoMediatorDidProvidedError } from '../error'
import { useDidCommMessagePickup } from './useDidCommMessagePickup'

export function useDidCommMediatorSetup({
  agent,
  hasInternetConnection,
  mediatorDid,
}: {
  agent?: DidCommAgent
  hasInternetConnection: boolean
  mediatorDid?: string
}) {
  const [isSettingUpMediation, setIsSettingUpMediation] = useState(false)
  const [isMediationConfigured, setIsMediationConfigured] = useState(false)

  // Enable message pickup when mediation is configured and internet connection is available
  useDidCommMessagePickup({
    isEnabled: hasInternetConnection && isMediationConfigured,
    agent,
  })

  useEffect(() => {
    if (!agent) return
    if (!hasInternetConnection || isMediationConfigured) return
    if (isSettingUpMediation) return

    setIsSettingUpMediation(true)

    agent.config.logger.debug('Checking if mediation is configured')

    void hasMediationConfigured(agent)
      .then(async (mediationConfigured) => {
        if (!mediationConfigured) {
          agent.config.logger.debug('Mediation not configured yet')
          if (!mediatorDid) throw new ParadymWalletNoMediatorDidProvidedError()
          await setupMediationWithDid(agent, mediatorDid)
        }

        agent.config.logger.info('Mediation configured')
        setIsMediationConfigured(true)
      })
      .finally(() => {
        setIsSettingUpMediation(false)
      })
  }, [agent, isMediationConfigured, isSettingUpMediation, hasInternetConnection, mediatorDid])

  return { isMediationConfigured, isSettingUpMediation }
}
