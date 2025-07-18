import { useEffect, useState } from 'react'
import { hasMediationConfigured, setupMediationWithDid } from '../didcomm/mediation'
import { ParadymWalletNoMediatorDidProvidedError } from '../error'
import { useParadymWalletSdk } from '../providers/ParadymWalletSdkProvider'
import { useDidCommMessagePickup } from './useDidCommMessagePickup'

export function useDidCommMediatorSetup({
  hasInternetConnection,
  mediatorDid,
}: {
  hasInternetConnection: boolean
  mediatorDid?: string
}) {
  const pws = useParadymWalletSdk()
  const { logger } = pws.hooks.useLogger()
  const [isSettingUpMediation, setIsSettingUpMediation] = useState(false)
  const [isMediationConfigured, setIsMediationConfigured] = useState(false)

  // Enable message pickup when mediation is configured and internet connection is available
  useDidCommMessagePickup({
    isEnabled: hasInternetConnection && isMediationConfigured,
  })

  useEffect(() => {
    if (!hasInternetConnection || isMediationConfigured) return
    if (isSettingUpMediation) return

    setIsSettingUpMediation(true)

    logger.debug('Checking if mediation is configured')

    void hasMediationConfigured(pws.agent)
      .then(async (mediationConfigured) => {
        if (!mediationConfigured) {
          logger.debug('Mediation not configured yet')
          if (!mediatorDid) throw new ParadymWalletNoMediatorDidProvidedError()
          await setupMediationWithDid(pws.agent, mediatorDid)
        }

        logger.info('Mediation configured')
        setIsMediationConfigured(true)
      })
      .finally(() => {
        setIsSettingUpMediation(false)
      })
  }, [isMediationConfigured, isSettingUpMediation, hasInternetConnection, mediatorDid, logger, pws.agent])

  return { isMediationConfigured, isSettingUpMediation }
}
