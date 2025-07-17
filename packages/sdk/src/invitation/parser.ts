import { verifyOpenid4VpAuthorizationRequest } from '@animo-id/eudi-wallet-functionality'
import { parseInvitationJson } from '@credo-ts/didcomm/build/util/parseInvitation'
import queryString from 'query-string'
import type { DidCommAgent, FullAgent, OpenId4VcAgent } from '../agent'
import { type CredentialForDisplay, getCredentialForDisplay } from '../display/credential'
import { ParadymWalletInvitationNotRecognizedError } from '../error'
import { type FormattedSubmission, getFormattedSubmission } from '../format/submission'
import { fetchInvitationDataUrl } from './fetch'
import {
  acquirePreAuthorizedAccessToken,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
} from './resolver'

export type InvitationType = 'didcomm' | 'openid-credential-offer' | 'openid-authorization-request'

export type InvitationResult =
  | {
      __internal: {
        id: string
      }
      didcomm: {
        imageUrl?: string
        label?: string
      }
    }
  | {
      __internal: { id: string }
      credentialOffer: {
        display: CredentialForDisplay
      }
    }
  | {
      __internal: { id: string }
      presentationRequest: {
        formattedSubmission: FormattedSubmission
      }
    }

export enum InvitationQrTypes {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance://',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer://',
  OPENID4VP = 'openid4vp://',
  EUDI_OPENID4VP = 'eudi-openid4vp://',
  MDOC_OPENID4VP = 'mdoc-openid4vp://',
  OPENID_VC = 'openid-vc://',
  DIDCOMM = 'didcomm://',
  HTTPS = 'https://',
  HAIP = 'haip://',

  // TODO: this is included here, do want to allow for custom invitation types?
  EASY_PID = 'id.animo.ausweis:',
}

export const isOpenIdCredentialOffer = (url: string) => {
  if (
    url.startsWith(InvitationQrTypes.OPENID_INITIATE_ISSUANCE) ||
    url.startsWith(InvitationQrTypes.OPENID_CREDENTIAL_OFFER)
  ) {
    return true
  }

  if (url.includes('credential_offer_uri=') || url.includes('credential_offer=')) {
    return true
  }

  return false
}

export const isOpenIdPresentationRequest = (url: string) => {
  if (
    url.startsWith(InvitationQrTypes.OPENID_VC) ||
    url.startsWith(InvitationQrTypes.OPENID4VP) ||
    url.startsWith(InvitationQrTypes.EUDI_OPENID4VP) ||
    url.startsWith(InvitationQrTypes.MDOC_OPENID4VP)
  ) {
    return true
  }

  if (url.includes('request_uri=') || url.includes('request=')) {
    return true
  }

  return false
}

export const isDidCommInvitation = (url: string) => {
  if (url.startsWith(InvitationQrTypes.DIDCOMM)) {
    return true
  }

  if (url.includes('c_i=') || url.includes('oob=') || url.includes('oobUrl=') || url.includes('d_m=')) {
    return true
  }

  return false
}

export async function parseDidCommInvitation(agent: DidCommAgent, invitation: string | Record<string, unknown>) {
  if (typeof invitation === 'string') {
    const parsedUrl = queryString.parseUrl(invitation)
    const updatedInvitationUrl = (parsedUrl.query.oobUrl as string | undefined) ?? invitation

    // Try to parse the invitation as an DIDComm invitation.
    // We can't know for sure, as it could be a shortened URL to a DIDComm invitation.
    // So we use the parseMessage from credo and see if this returns a valid message.
    // Parse invitation supports legacy connection invitations, oob invitations, and
    // legacy connectionless invitations, and will all transform them into an OOB invitation.
    const parsedInvitation = await agent.modules.outOfBand.parseInvitation(updatedInvitationUrl)
    agent.config.logger.debug(`Parsed didcomm invitation with id ${parsedInvitation.id}`)
    return parsedInvitation
  }
  return parseInvitationJson(invitation)
}

export async function parseOpenIdCredentialOfferInvitation(agent: OpenId4VcAgent, invitationUrl: string) {
  const { resolvedCredentialOffer } = await resolveOpenId4VciOffer({ agent, offer: { uri: invitationUrl } })
  const tokenResponse = await acquirePreAuthorizedAccessToken({ agent, resolvedCredentialOffer })
  const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
    agent,
    resolvedCredentialOffer,
    accessToken: tokenResponse,
  })

  const [{ credential }] = credentialResponses

  const display = getCredentialForDisplay(credential)

  return {
    id: credential.id,
    display,
  }
}

export async function parseOpenIdPresentationRequestInvitation(agent: OpenId4VcAgent, invitationUrl: string) {
  const resolved = await agent.modules.openId4VcHolder.resolveOpenId4VpAuthorizationRequest(invitationUrl)

  // TODO: only when eudi trust is enabled
  const authorizationRequestVerificationResult = await verifyOpenid4VpAuthorizationRequest(agent.context, {
    resolvedAuthorizationRequest: resolved,
  })

  // TODO: this object is too complex. Should be extremely simplified
  const formattedSubmission = getFormattedSubmission(resolved)

  // The output of this should be the input into the `shareProof` method

  return {
    id: 'TODO',
    formattedSubmission,
  }
}

// TODO: do not just return the invitation URL, but actually the useful information
export async function parseInvitationUrl(agent: FullAgent, invitationUrl: string): Promise<InvitationResult> {
  if (isOpenIdCredentialOffer(invitationUrl)) {
    const metadata = await parseOpenIdCredentialOfferInvitation(agent, invitationUrl)

    return {
      __internal: { id: metadata.id },
      credentialOffer: {
        display: metadata.display,
      },
    }
  }

  if (isOpenIdPresentationRequest(invitationUrl)) {
    const { formattedSubmission, id } = await parseOpenIdPresentationRequestInvitation(agent, invitationUrl)

    return {
      __internal: { id },
      presentationRequest: { formattedSubmission },
    }
  }

  if (isDidCommInvitation(invitationUrl)) {
    const outOfBandInvitation = await parseDidCommInvitation(agent, invitationUrl)

    return {
      __internal: { id: outOfBandInvitation.id },
      didcomm: {
        imageUrl: outOfBandInvitation.imageUrl,
        label: outOfBandInvitation.label,
      },
    }
  }

  // If we can't detect the type of invitation from the URL, we will try to fetch the data from the URL
  // and see if we can detect if based on the response
  if (invitationUrl.startsWith('https://')) {
    return await fetchInvitationDataUrl(agent, invitationUrl)
  }

  throw new ParadymWalletInvitationNotRecognizedError()
}
