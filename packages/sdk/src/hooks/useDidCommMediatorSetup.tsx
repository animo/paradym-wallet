import { useEffect, useState } from 'react'
import { assertDidcommAgent } from '../agent'
import { hasMediationConfigured, setupMediationWithDid } from '../didcomm/mediation'
import { ParadymWalletNoMediatorDidProvidedError } from '../error'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
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
    paradym,
    isEnabled: isMediationConfigured,
  })

  // TODO(sdk): triggered a lot during onboarding
  useEffect(() => {
    if (!paradym) return
    if (isMediationConfigured) return
    if (isSettingUpMediation) return
    try {
      assertDidcommAgent(paradym.agent)
    } catch {
      return
    }

    setIsSettingUpMediation(true)

    paradym.logger.debug('Checking if mediation is configured')

    void hasMediationConfigured(paradym)
      .then(async (mediationConfigured) => {
        if (!mediationConfigured) {
          paradym.logger.debug('Mediation not configured yet')
          if (!mediatorDid) throw new ParadymWalletNoMediatorDidProvidedError()
          await setupMediationWithDid(paradym, mediatorDid)
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
