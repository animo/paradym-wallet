import { JsonEncoder } from '@credo-ts/core'
import { parseInvitationJson } from '@credo-ts/didcomm'
import queryString from 'query-string'
import { ParadymWalletInvitationNotRecognizedError } from '../error'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { fetchInvitationDataUrl } from './fetch'

export type InvitationType = 'didcomm' | 'openid-credential-offer' | 'openid-authorization-request'

export type InvitationResult = InvitationParsedResult | InvitationUrlResult

export type InvitationParsedResult = {
  type: InvitationType
  format: 'parsed'
  data: Record<string, unknown> | string
}

export type InvitationUrlResult = {
  type: InvitationType
  format: 'url'
  data: string
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

export async function parseDidCommInvitation(paradym: ParadymWalletSdk, invitation: string | Record<string, unknown>) {
  if (typeof invitation === 'string') {
    const parsedUrl = queryString.parseUrl(invitation)
    const updatedInvitationUrl = (parsedUrl.query.oobUrl as string | undefined) ?? invitation

    // Try to parse the invitation as an DIDComm invitation.
    // We can't know for sure, as it could be a shortened URL to a DIDComm invitation.
    // So we use the parseMessage from credo and see if this returns a valid message.
    // Parse invitation supports legacy connection invitations, oob invitations, and
    // legacy connectionless invitations, and will all transform them into an OOB invitation.
    const parsedInvitation = await paradym.agent.didcomm.oob.parseInvitation(updatedInvitationUrl)
    paradym.logger.debug(`Parsed didcomm invitation with id ${parsedInvitation.id}`)
    return parsedInvitation
  }
  return parseInvitationJson(invitation)
}

export async function parseInvitationUrl(
  _paradym: ParadymWalletSdk,
  invitationUrl: string
): Promise<InvitationUrlResult> {
  if (isOpenIdCredentialOffer(invitationUrl)) {
    return {
      format: 'url',
      type: 'openid-credential-offer',
      data: invitationUrl,
    }
  }

  if (isOpenIdPresentationRequest(invitationUrl)) {
    return {
      format: 'url',
      type: 'openid-authorization-request',
      data: invitationUrl,
    }
  }

  if (isDidCommInvitation(invitationUrl)) {
    return {
      format: 'url',
      type: 'didcomm',
      data: invitationUrl,
    }
  }

  // If we can't detect the type of invitation from the URL, we will try to fetch the data from the URL
  // and see if we can detect if based on the response
  if (invitationUrl.startsWith('https://')) {
    const invitation = await fetchInvitationDataUrl(invitationUrl)

    // We can't just fetch a QR url directly except for DIDComm
    if (invitation.type !== 'didcomm') {
      throw new ParadymWalletInvitationNotRecognizedError()
    }

    // Transform to url to make it easier to pass around in naviagation
    if (invitation.format === 'parsed') {
      return {
        data: `didcomm://?oob=${JsonEncoder.toBase64URL(invitation.data)}`,
        format: 'url',
        type: 'didcomm',
      }
    }
  }

  throw new ParadymWalletInvitationNotRecognizedError()
}

export function parseInvitationUrlSync(invitationUrl: string): InvitationUrlResult {
  if (isOpenIdCredentialOffer(invitationUrl)) {
    return {
      format: 'url',
      type: 'openid-credential-offer',
      data: invitationUrl,
    }
  }

  if (isOpenIdPresentationRequest(invitationUrl)) {
    return {
      format: 'url',
      type: 'openid-authorization-request',
      data: invitationUrl,
    }
  }

  if (isDidCommInvitation(invitationUrl)) {
    return {
      format: 'url',
      type: 'didcomm',
      data: invitationUrl,
    }
  }

  if (invitationUrl.startsWith('https://')) {
    return {
      data: invitationUrl,
      format: 'url',
      type: 'didcomm',
    }
  }

  throw new ParadymWalletInvitationNotRecognizedError()
}
