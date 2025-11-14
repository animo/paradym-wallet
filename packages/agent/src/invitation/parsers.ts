import type { ParadymAppAgent } from '../agent'

import { parseInvitationJson } from '@credo-ts/didcomm'
import { commonMessages, i18n } from '@package/translations'
import queryString from 'query-string'

import { JsonEncoder } from '@credo-ts/core'
import { fetchInvitationDataUrl } from './fetchInvitation'

export type InvitationType = 'didcomm' | 'openid-credential-offer' | 'openid-authorization-request'
export type ParseInvitationResultError = 'invitation_not_recognized' | 'parse_error' | 'retrieve_invitation_error'
export type ParseInvitationResult =
  | {
      success: true
      result: ParsedInvitationTypeUrl
    }
  | {
      success: false
      error: ParseInvitationResultError
      message: string
    }

export type ParsedInvitationTypeData = {
  type: InvitationType
  format: 'parsed'
  data: Record<string, unknown> | string
}

export type ParsedInvitationTypeUrl = {
  type: InvitationType
  format: 'url'
  data: string
}

export enum InvitationQrTypes {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance://',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer://',
  // TODO: I think we should not support openid://, as we mainly support openid4vp
  // But older requests do use openid:// I think (such as the DIIP dbc login)
  // but I think we're going to move to just openid4p in the future
  OPENID = 'openid://',
  OPENID4VP = 'openid4vp://',
  EUDI_OPENID4VP = 'eudi-openid4vp://',
  MDOC_OPENID4VP = 'mdoc-openid4vp://',
  OPENID_VC = 'openid-vc://',
  DIDCOMM = 'didcomm://',
  HTTPS = 'https://',
  HAIP = 'haip://',
  HAIP_VCI = 'haip-vci://',
  HAIP_VP = 'haip-vp://',
  EASY_PID = 'id.animo.ausweis:',
  PARADYM = 'id.animo.paradym:',
}

export const isOpenIdCredentialOffer = (url: string) => {
  if (
    url.startsWith(InvitationQrTypes.OPENID_INITIATE_ISSUANCE) ||
    url.startsWith(InvitationQrTypes.OPENID_CREDENTIAL_OFFER) ||
    url.startsWith(InvitationQrTypes.HAIP_VCI)
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
    url.startsWith(InvitationQrTypes.OPENID) ||
    url.startsWith(InvitationQrTypes.OPENID_VC) ||
    url.startsWith(InvitationQrTypes.OPENID4VP) ||
    url.startsWith(InvitationQrTypes.EUDI_OPENID4VP) ||
    url.startsWith(InvitationQrTypes.MDOC_OPENID4VP) ||
    url.startsWith(InvitationQrTypes.HAIP_VP)
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

export async function parseDidCommInvitation(agent: ParadymAppAgent, invitation: string | Record<string, unknown>) {
  try {
    if (typeof invitation === 'string') {
      const parsedUrl = queryString.parseUrl(invitation)
      const updatedInvitationUrl = (parsedUrl.query.oobUrl as string | undefined) ?? invitation

      // Try to parse the invitation as an DIDComm invitation.
      // We can't know for sure, as it could be a shortened URL to a DIDComm invitation.
      // So we use the parseMessage from AFJ and see if this returns a valid message.
      // Parse invitation supports legacy connection invitations, oob invitations, and
      // legacy connectionless invitations, and will all transform them into an OOB invitation.
      const parsedInvitation = await agent.didcomm.oob.parseInvitation(updatedInvitationUrl)

      agent.config.logger.debug(`Parsed didcomm invitation with id ${parsedInvitation.id}`)
      return {
        success: true,
        result: parsedInvitation,
      } as const
    }

    return {
      success: true,
      result: parseInvitationJson(invitation),
    } as const
  } catch (error) {
    return {
      success: false,
      error: 'parsing_failed',
      message: i18n.t(commonMessages.invitationParsingFailed),
    } as const
  }
}

export function parseInvitationUrlSync(invitationUrl: string): ParseInvitationResult {
  if (isOpenIdCredentialOffer(invitationUrl)) {
    return {
      success: true,
      result: {
        format: 'url',
        type: 'openid-credential-offer',
        data: invitationUrl,
      },
    }
  }

  if (isOpenIdPresentationRequest(invitationUrl)) {
    return {
      success: true,
      result: {
        format: 'url',
        type: 'openid-authorization-request',
        data: invitationUrl,
      },
    }
  }

  if (isDidCommInvitation(invitationUrl)) {
    return {
      success: true,
      result: {
        format: 'url',
        type: 'didcomm',
        data: invitationUrl,
      },
    }
  }

  if (invitationUrl.startsWith('https://')) {
    return {
      success: true,
      result: {
        data: invitationUrl,
        format: 'url',
        type: 'didcomm',
      },
    }
  }

  return {
    success: false,
    error: 'invitation_not_recognized',
    message: i18n.t(commonMessages.invitationNotRecognized),
  }
}

export async function parseInvitationUrl(invitationUrl: string): Promise<ParseInvitationResult> {
  if (isOpenIdCredentialOffer(invitationUrl)) {
    return {
      success: true,
      result: {
        format: 'url',
        type: 'openid-credential-offer',
        data: invitationUrl,
      },
    }
  }

  if (isOpenIdPresentationRequest(invitationUrl)) {
    return {
      success: true,
      result: {
        format: 'url',
        type: 'openid-authorization-request',
        data: invitationUrl,
      },
    }
  }

  if (isDidCommInvitation(invitationUrl)) {
    return {
      success: true,
      result: {
        format: 'url',
        type: 'didcomm',
        data: invitationUrl,
      },
    }
  }

  // If we can't detect the type of invitation from the URL, we will try to fetch the data from the URL
  // and see if we can detect if based on the response
  if (invitationUrl.startsWith('https://')) {
    const invitation = await fetchInvitationDataUrl(invitationUrl)
    if (!invitation.success) return invitation

    // We can't just fetch a QR url directly except for DIDComm
    if (invitation.result.type !== 'didcomm') {
      return {
        success: false,
        error: 'invitation_not_recognized',
        message: i18n.t(commonMessages.invitationNotRecognized),
      }
    }

    // Transform to url to make it easier to pass around in naviagation
    if (invitation.result.format === 'parsed') {
      return {
        success: true,
        result: {
          data: `didcomm://?oob=${JsonEncoder.toBase64URL(invitation.result.data)}`,
          format: 'url',
          type: 'didcomm',
        },
      }
    }
  }

  return {
    success: false,
    error: 'invitation_not_recognized',
    message: i18n.t(commonMessages.invitationNotRecognized),
  }
}
