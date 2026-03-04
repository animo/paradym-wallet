import { CredoError } from '@credo-ts/core'
import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'
import { assertAgentType } from '../agent'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

/**
 * Check whether a default mediator is configued
 */
export async function hasMediationConfigured(paradym: ParadymWalletSdk) {
  assertAgentType(paradym.agent, 'didcomm')
  const mediationRecord = await paradym.agent.didcomm.mediationRecipient.findDefaultMediator()

  return mediationRecord !== null
}

/**
 * Create connection to mediator and request mediation.
 *
 * This connects based on a did
 */
export async function setupMediationWithDid(paradym: ParadymWalletSdk, mediatorDid: string) {
  assertAgentType(paradym.agent, 'didcomm')
  // If the invitation is a did, the invitation id is the did
  const outOfBandRecord = await paradym.agent.didcomm.oob.findByReceivedInvitationId(mediatorDid)
  let [connection] = outOfBandRecord
    ? await paradym.agent.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
    : []

  if (!connection) {
    paradym.logger.debug('Mediation connection does not exist, creating connection')
    // We don't want to use the current default mediator when connecting to another mediator
    const routing = await paradym.agent.didcomm.mediationRecipient.getRouting({ useDefaultMediator: false })

    paradym.logger.debug('Routing created', { routing })
    const { connectionRecord: newConnection } = await paradym.agent.didcomm.oob.receiveImplicitInvitation({
      did: mediatorDid,
      routing,
      label: '',
    })
    paradym.logger.debug('Mediation invitation processed', { mediatorDid })

    if (!newConnection) {
      throw new CredoError('No connection record to provision mediation.')
    }

    connection = newConnection
  }

  const readyConnection = connection.isReady
    ? connection
    : await paradym.agent.didcomm.connections.returnWhenIsConnected(connection.id)

  return paradym.agent.didcomm.mediationRecipient.provision(readyConnection)
}

/**
 * Initiate message pickup from the mediator.
 */
export async function initiateMessagePickup(paradym: ParadymWalletSdk) {
  assertAgentType(paradym.agent, 'didcomm')
  paradym.logger.info('Initiating message pickup from mediator')

  // Iniate message pickup from the mediator. Passing no mediator, will use default mediator
  await paradym.agent.didcomm.mediationRecipient.initiateMessagePickup(
    undefined,
    DidCommMediatorPickupStrategy.Implicit
  )
}

/**
 * Stop message pickup from the mediator.
 */
export async function stopMessagePickup(paradym: ParadymWalletSdk) {
  assertAgentType(paradym.agent, 'didcomm')
  paradym.logger.info('Stopping message pickup from mediator')

  // Stop message pickup. Will stopp all message pickup, not just from the mediator
  await paradym.agent.didcomm.mediationRecipient.stopMessagePickup()
}
