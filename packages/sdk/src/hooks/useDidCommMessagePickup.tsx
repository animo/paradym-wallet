import { useEffect } from 'react'
import type { DidCommAgent } from '../agent'
import { initiateMessagePickup, stopMessagePickup } from '../didcomm/mediation'

/**
 * Hook to enable message pickup from the mediator.
 *
 * You can use the `isEnabled` config property to enable/disable message pickup.
 * This is useful if e.g. there's no internet connection, or mediation has not been setup yet
 */
export function useDidCommMessagePickup({
  isEnabled = true,
  agent,
}: {
  isEnabled?: boolean
  agent?: DidCommAgent
}) {
  useEffect(() => {
    // If no agent, do nothing
    if (!agent) return
    // Do not pickup messages if not enabled
    if (!isEnabled) return

    agent.config.logger.debug('Initiating message pickup.')

    void initiateMessagePickup(agent)

    // Stop message pickup when component unmounts
    return () => {
      void stopMessagePickup(agent)
    }
  }, [isEnabled, agent])
}
