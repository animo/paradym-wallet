import ExpoConstants from 'expo-constants'

const MEDIATOR_INVITATION_URL = ExpoConstants.expoConfig?.extra?.mediatorInvitationUrl as
  | string
  | undefined

const MEDIATOR_DID = ExpoConstants.expoConfig?.extra?.mediatorDid as string | undefined

if (!MEDIATOR_INVITATION_URL || typeof MEDIATOR_INVITATION_URL !== 'string') {
  throw new Error('Mediator invitation url not found in expo config')
}

if (!MEDIATOR_DID || typeof MEDIATOR_DID !== 'string') {
  throw new Error('Mediator DID not found in expo config')
}

export const mediatorInvitationUrl = MEDIATOR_INVITATION_URL
export const mediatorDid = MEDIATOR_DID
