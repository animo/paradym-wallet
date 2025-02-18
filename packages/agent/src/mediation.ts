import type { ParadymAppAgent } from './agent'

import { CredoError } from '@credo-ts/core'
import { MediatorPickupStrategy } from '@credo-ts/didcomm'
import { useEffect } from 'react'

/**
 * Check whether a default mediator is configued
 */
export async function hasMediationConfigured(agent: ParadymAppAgent) {
  const mediationRecord = await agent.modules.mediationRecipient.findDefaultMediator()

  return mediationRecord !== null
}

/**
 * Create connection to mediator and request mediation.
 *
 * This connects based on a did
 */
export async function setupMediationWithDid(agent: ParadymAppAgent, mediatorDid: string) {
  // If the invitation is a did, the invitation id is the did
  const outOfBandRecord = await agent.modules.outOfBand.findByReceivedInvitationId(mediatorDid)
  let [connection] = outOfBandRecord ? await agent.modules.connections.findAllByOutOfBandId(outOfBandRecord.id) : []

  if (!connection) {
    agent.config.logger.debug('Mediation connection does not exist, creating connection')
    // We don't want to use the current default mediator when connecting to another mediator
    const routing = await agent.modules.mediationRecipient.getRouting({ useDefaultMediator: false })

    agent.config.logger.debug('Routing created', routing)
    const { connectionRecord: newConnection } = await agent.modules.outOfBand.receiveImplicitInvitation({
      did: mediatorDid,
      routing,
    })
    agent.config.logger.debug('Mediation invitation processed', { mediatorDid })

    if (!newConnection) {
      throw new CredoError('No connection record to provision mediation.')
    }

    connection = newConnection
  }

  const readyConnection = connection.isReady
    ? connection
    : await agent.modules.connections.returnWhenIsConnected(connection.id)

  return agent.modules.mediationRecipient.provision(readyConnection)
}

/**
 * Initiate message pickup from the mediator.
 */
async function initiateMessagePickup(agent: ParadymAppAgent) {
  agent.config.logger.info('Initiating message pickup from mediator')

  // Iniate message pickup from the mediator. Passing no mediator, will use default mediator
  await agent.modules.mediationRecipient.initiateMessagePickup(undefined, MediatorPickupStrategy.Implicit)
}

/**
 * Stop message pickup from the mediator.
 */
async function stopMessagePickup(agent: ParadymAppAgent) {
  agent.config.logger.info('Stopping message pickup from mediator')

  // Stop message pickup. Will stopp all message pickup, not just from the mediator
  await agent.modules.mediationRecipient.stopMessagePickup()
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
  agent?: ParadymAppAgent
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
