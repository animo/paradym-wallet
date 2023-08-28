import type { AppAgent } from './agent'

import { AriesFrameworkError, MediatorPickupStrategy } from '@aries-framework/core'
import { useEffect } from 'react'

import { useAgent } from './agent'

/**
 * Check whether a default mediator is configued
 */
export async function hasMediationConfigured(agent: AppAgent) {
  const mediationRecord = await agent.mediationRecipient.findDefaultMediator()

  mediationRecord !== null
}

/**
 * Create connection to mediator and request mediation.
 */
export async function setupMediation(agent: AppAgent, mediatorInvitationUrl: string) {
  const outOfBandInvitation = await agent.oob.parseInvitation(mediatorInvitationUrl)
  const outOfBandRecord = await agent.oob.findByReceivedInvitationId(outOfBandInvitation.id)
  const [connection] = outOfBandRecord
    ? await agent.connections.findAllByOutOfBandId(outOfBandRecord.id)
    : []

  if (!connection) {
    agent.config.logger.debug('Mediation connection does not exist, creating connection')
    // We don't want to use the current default mediator when connecting to another mediator
    const routing = await agent.mediationRecipient.getRouting({ useDefaultMediator: false })

    agent.config.logger.debug('Routing created', routing)
    const { connectionRecord: newConnection } = await agent.oob.receiveInvitation(
      outOfBandInvitation,
      {
        routing,
      }
    )
    agent.config.logger.debug(`Mediation invitation processed`, { outOfBandInvitation })

    if (!newConnection) {
      throw new AriesFrameworkError('No connection record to provision mediation.')
    }

    return agent.connections.returnWhenIsConnected(newConnection.id)
  }

  const readyConnection = connection.isReady
    ? connection
    : await agent.connections.returnWhenIsConnected(connection.id)

  return agent.mediationRecipient.provision(readyConnection)
}

/**
 * Initiate message pickup from the mediator.
 */
async function initiateMessagePickup(agent: AppAgent) {
  agent.config.logger.info('Initiating message pickup from mediator')

  // Iniate message pickup from the mediator. Passing no mediator, will use default mediator
  await agent.mediationRecipient.initiateMessagePickup(undefined, MediatorPickupStrategy.PickUpV2)
}

/**
 * Stop message pickup from the mediator.
 */
async function stopMessagePickup(agent: AppAgent) {
  agent.config.logger.info('Stopping message pickup from mediator')

  // Stop message pickup. Will stopp all message pickup, not just from the mediator
  await agent.mediationRecipient.stopMessagePickup()
}

/**
 * Hook to enable message pickup from the mediator.
 *
 * You can use the `isEnabled` config property to enable/disable message pickup.
 * This is useful if e.g. there's no internet connection, or mediation has not been setup yet
 */
export function useMessagePickup({ isEnabled = true }: { isEnabled?: boolean }) {
  const { agent } = useAgent()

  useEffect(() => {
    // Do not pickup messages if not enabled
    if (!isEnabled) return

    void initiateMessagePickup(agent)

    // Stop message pickup when component unmounts
    return () => {
      void stopMessagePickup(agent)
    }
  }, [isEnabled])
}
