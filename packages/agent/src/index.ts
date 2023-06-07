import { PresentationExchangeService } from './presentations/PresentationExchangeService'
import {
  multipleCredentialPresentationDefinition,
  dbcPresentationDefinition,
} from './presentations/fixtures'

export { initializeAgent, useAgent, AppAgent } from './agent'
export * from './providers'
export * from './parsers'
export * from './display'

// NOTE: this is temporary so we have some data to work with for proof requests
const presentationExchangeService = new PresentationExchangeService()

export {
  presentationExchangeService,
  multipleCredentialPresentationDefinition,
  dbcPresentationDefinition,
}
