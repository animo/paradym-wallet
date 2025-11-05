import { useEffect } from 'react'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { initiateMessagePickup, stopMessagePickup } from '../didcomm/mediation'

/**
 * Hook to enable message pickup from the mediator.
 *
 * You can use the `isEnabled` config property to enable/disable message pickup.
 * This is useful if e.g. there's no internet connection, or mediation has not been setup yet
 */
export function useDidCommMessagePickup({
  isEnabled = true,
  paradym,
}: {
  isEnabled?: boolean
  paradym?: ParadymWalletSdk
}) {
  useEffect(() => {
    // Do not pickup messages if not enabled
    if (!isEnabled || !paradym) return

    paradym.logger.debug('Initiating message pickup.')

    void initiateMessagePickup(paradym.agent)

    // Stop message pickup when component unmounts
    return () => {
      void stopMessagePickup(paradym.agent)
    }
  }, [isEnabled, paradym])
}
