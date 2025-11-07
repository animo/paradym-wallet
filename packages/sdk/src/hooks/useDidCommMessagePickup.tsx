import { useEffect } from 'react'
import { initiateMessagePickup, stopMessagePickup } from '../didcomm/mediation'
import { useParadym } from './useParadym'

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
  const { paradym } = useParadym('unlocked')

  useEffect(() => {
    // Do not pickup messages if not enabled
    if (!isEnabled || !paradym.isDidCommEnabled) return

    paradym.logger.debug('Initiating message pickup.')

    void initiateMessagePickup(paradym)

    // Stop message pickup when component unmounts
    return () => {
      void stopMessagePickup(paradym)
    }
  }, [isEnabled, paradym])
}
