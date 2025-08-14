import { useEffect, useState } from 'react'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { hasMediationConfigured, setupMediationWithDid } from '../didcomm/mediation'
import { ParadymWalletNoMediatorDidProvidedError } from '../error'
import { useDidCommMessagePickup } from './useDidCommMessagePickup'

export function useDidCommMediatorSetup({
  hasInternetConnection,
  mediatorDid,
  paradym,
}: {
  hasInternetConnection: boolean
  mediatorDid?: string
  paradym?: ParadymWalletSdk
}) {
  const [isSettingUpMediation, setIsSettingUpMediation] = useState(false)
  const [isMediationConfigured, setIsMediationConfigured] = useState(false)

  // Enable message pickup when mediation is configured and internet connection is available
  useDidCommMessagePickup({
    isEnabled: hasInternetConnection && isMediationConfigured,
  })

  useEffect(() => {
    if (!paradym) return
    if (!hasInternetConnection || isMediationConfigured) return
    if (isSettingUpMediation) return

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
  }, [isMediationConfigured, isSettingUpMediation, hasInternetConnection, mediatorDid, paradym])

  return { isMediationConfigured, isSettingUpMediation }
}
