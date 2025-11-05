import { useEffect, useState } from 'react'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { hasMediationConfigured, setupMediationWithDid } from '../didcomm/mediation'
import { ParadymWalletNoMediatorDidProvidedError } from '../error'
import { useDidCommMessagePickup } from './useDidCommMessagePickup'

export function useDidCommMediatorSetup({
  mediatorDid,
  paradym,
}: {
  mediatorDid?: string
  paradym?: ParadymWalletSdk
}) {
  const [isSettingUpMediation, setIsSettingUpMediation] = useState(false)
  const [isMediationConfigured, setIsMediationConfigured] = useState(false)

  // Enable message pickup when mediation is configured and internet connection is available
  useDidCommMessagePickup({
    isEnabled: isMediationConfigured,
  })

  useEffect(() => {
    if (!paradym) return
    if (isMediationConfigured) return
    if (isSettingUpMediation) return
    if (!('mediationRecipient' in paradym.agent.modules)) return

    setIsSettingUpMediation(true)

    paradym.logger.debug('Checking if mediation is configured')

    void hasMediationConfigured(paradym.agent)
      .then(async (mediationConfigured) => {
        if (!mediationConfigured) {
          paradym.logger.debug('Mediation not configured yet')
          if (!mediatorDid) throw new ParadymWalletNoMediatorDidProvidedError()
          await setupMediationWithDid(paradym.agent, mediatorDid)
        }

        paradym.logger.info('Mediation configured')
        setIsMediationConfigured(true)
      })
      .finally(() => {
        setIsSettingUpMediation(false)
      })
  }, [isMediationConfigured, isSettingUpMediation, mediatorDid, paradym])

  return { isMediationConfigured, isSettingUpMediation }
}
