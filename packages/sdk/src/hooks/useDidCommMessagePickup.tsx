import { useEffect } from 'react'
import { initiateMessagePickup, stopMessagePickup } from '../didcomm/mediation'
import { useParadymWalletSdk } from '../providers/ParadymWalletSdkProvider'

/**
 * Hook to enable message pickup from the mediator.
 *
 * You can use the `isEnabled` config property to enable/disable message pickup.
 * This is useful if e.g. there's no internet connection, or mediation has not been setup yet
 */
export function useDidCommMessagePickup({
  isEnabled = true,
}: {
  isEnabled?: boolean
}) {
  const pws = useParadymWalletSdk()
  const { logger } = pws.hooks.useLogger()

  useEffect(() => {
    // Do not pickup messages if not enabled
    if (!isEnabled) return

    logger.debug('Initiating message pickup.')

    void initiateMessagePickup(pws.agent)

    // Stop message pickup when component unmounts
    return () => {
      void stopMessagePickup(pws.agent)
    }
  }, [isEnabled, pws.agent, logger.debug])
}
