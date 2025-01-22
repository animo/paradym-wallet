import type { FullAppAgent } from './agent'

import { CredoError, MediatorPickupStrategy } from '@credo-ts/core'
import { useEffect } from 'react'

/**
 * Check whether a default mediator is configued
 */
export async function hasMediationConfigured(agent: FullAppAgent) {
  const mediationRecord = await agent.mediationRecipient.findDefaultMediator()

  return mediationRecord !== null
}

/**
 * Create connection to mediator and request mediation.
 *
 * This connects based on a did
 */
export async function setupMediationWithDid(agent: FullAppAgent, mediatorDid: string) {
  // If the invitation is a did, the invitation id is the did
  const outOfBandRecord = await agent.oob.findByReceivedInvitationId(mediatorDid)
  let [connection] = outOfBandRecord ? await agent.connections.findAllByOutOfBandId(outOfBandRecord.id) : []

  if (!connection) {
    agent.config.logger.debug('Mediation connection does not exist, creating connection')
    // We don't want to use the current default mediator when connecting to another mediator
    const routing = await agent.mediationRecipient.getRouting({ useDefaultMediator: false })

    agent.config.logger.debug('Routing created', routing)
    const { connectionRecord: newConnection } = await agent.oob.receiveImplicitInvitation({
      did: mediatorDid,
      routing,
    })
    agent.config.logger.debug('Mediation invitation processed', { mediatorDid })

    if (!newConnection) {
      throw new CredoError('No connection record to provision mediation.')
    }

    connection = newConnection
  }

  const readyConnection = connection.isReady ? connection : await agent.connections.returnWhenIsConnected(connection.id)

  return agent.mediationRecipient.provision(readyConnection)
}

/**
 * Initiate message pickup from the mediator.
 */
async function initiateMessagePickup(agent: FullAppAgent) {
  agent.config.logger.info('Initiating message pickup from mediator')

  // Iniate message pickup from the mediator. Passing no mediator, will use default mediator
  try {
    await agent.mediationRecipient.initiateMessagePickup(undefined, MediatorPickupStrategy.Implicit)
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Stop message pickup from the mediator.
 */
async function stopMessagePickup(agent: FullAppAgent) {
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
export function useMessagePickup({
  isEnabled = true,
  agent,
}: {
  isEnabled?: boolean
  agent?: FullAppAgent
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
