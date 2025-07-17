import { CredoError } from '@credo-ts/core'
import { MediatorPickupStrategy } from '@credo-ts/didcomm'
import type { DidCommAgent } from '../agent'

/**
 * Check whether a default mediator is configued
 */
export async function hasMediationConfigured(agent: DidCommAgent) {
  const mediationRecord = await agent.modules.mediationRecipient.findDefaultMediator()

  return mediationRecord !== null
}

/**
 * Create connection to mediator and request mediation.
 *
 * This connects based on a did
 */
export async function setupMediationWithDid(agent: DidCommAgent, mediatorDid: string) {
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
export async function initiateMessagePickup(agent: DidCommAgent) {
  agent.config.logger.info('Initiating message pickup from mediator')

  // Iniate message pickup from the mediator. Passing no mediator, will use default mediator
  await agent.modules.mediationRecipient.initiateMessagePickup(undefined, MediatorPickupStrategy.Implicit)
}

/**
 * Stop message pickup from the mediator.
 */
export async function stopMessagePickup(agent: DidCommAgent) {
  agent.config.logger.info('Stopping message pickup from mediator')

  // Stop message pickup. Will stopp all message pickup, not just from the mediator
  await agent.modules.mediationRecipient.stopMessagePickup()
}
