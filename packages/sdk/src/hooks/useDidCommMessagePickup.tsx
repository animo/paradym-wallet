import { useEffect } from 'react'
import { initiateMessagePickup, stopMessagePickup } from '../didcomm/mediation'
import { useParadym } from '../providers/ParadymWalletSdkProvider'

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
  const paradym = useParadym()

  useEffect(() => {
    // Do not pickup messages if not enabled
    if (!isEnabled) return

    paradym.logger.debug('Initiating message pickup.')

    void initiateMessagePickup(paradym.agent)

    // Stop message pickup when component unmounts
    return () => {
      void stopMessagePickup(paradym.agent)
    }
  }, [isEnabled, paradym.agent, paradym.logger.debug])
}
