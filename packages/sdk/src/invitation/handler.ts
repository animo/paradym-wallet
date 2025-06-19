import type { FullAgent } from '../agent'
import {
  ParadymWalletInvitationDidcommHandlerMustBeDefinedError,
  ParadymWalletInvitationOpenIdAuthorizationRequestHandlerMustBeDefinedError,
  ParadymWalletInvitationOpenIdCredentialHandlerMustBeDefinedError,
} from '../error'
import { parseInvitationUrl } from './parser'

export type HandleInvitationOptions = {
  agent: FullAgent

  didcommHandler?: () => void | Promise<void>

  // these names might be a bit too low-level
  openidCredentialOfferHandler?: () => void | Promise<void>
  openidAuthorizationRequestHandler?: () => void | Promise<void>
}

export const handleInvitation =
  ({ didcommHandler, openidCredentialOfferHandler, openidAuthorizationRequestHandler }: HandleInvitationOptions) =>
  async (invitationUrl: string) => {
    const parsedInvitation = await parseInvitationUrl(invitationUrl)

    if (parsedInvitation.success) {
      if (parsedInvitation.result.type === 'didcomm') {
        if (didcommHandler) {
          didcommHandler()
        } else {
          throw new ParadymWalletInvitationDidcommHandlerMustBeDefinedError()
        }
      } else if (parsedInvitation.result.type === 'openid-credential-offer') {
        if (openidCredentialOfferHandler) {
          openidCredentialOfferHandler()
        } else {
          throw new ParadymWalletInvitationOpenIdCredentialHandlerMustBeDefinedError()
        }
      } else if (parsedInvitation.result.type === 'openid-authorization-request') {
        if (openidAuthorizationRequestHandler) {
          openidAuthorizationRequestHandler()
        } else {
          throw new ParadymWalletInvitationOpenIdAuthorizationRequestHandlerMustBeDefinedError()
        }
      }
    }
  }
