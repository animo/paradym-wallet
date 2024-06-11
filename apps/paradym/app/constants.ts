import ExpoConstants from 'expo-constants'

const MEDIATOR_DID = ExpoConstants.expoConfig?.extra?.mediatorDid as string | undefined

if (!MEDIATOR_DID || typeof MEDIATOR_DID !== 'string') {
  throw new Error('Mediator DID not found in expo config')
}

export const mediatorDid = MEDIATOR_DID
