import { parseInvitationJson } from '@credo-ts/didcomm/build/util/parseInvitation'
import queryString from 'query-string'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { type CredentialForDisplay, getCredentialForDisplay } from '../display/credential'
import { ParadymWalletInvitationNotRecognizedError } from '../error'
import { type FormattedSubmission, getFormattedSubmission } from '../format/submission'
import { fetchInvitationDataUrl } from './fetch'
import {
  acquirePreAuthorizedAccessToken,
  receiveCredentialFromOpenId4VciOffer,
  resolveCredentialOffer,
} from './resolver'

export type InvitationType = 'didcomm' | 'openid-credential-offer' | 'openid-authorization-request'

export type InvitationResult = {
  __internal: {
    id: string
  }
  didcomm?: {
    imageUrl?: string
    label?: string
  }
  openId4VcPresentationRequest?: {
    formattedSubmission: FormattedSubmission
  }
  openId4VcCredentialOffer?: {
    display: CredentialForDisplay
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

export async function parseDidCommInvitation(paradym: ParadymWalletSdk, invitation: string | Record<string, unknown>) {
  if (typeof invitation === 'string') {
    const parsedUrl = queryString.parseUrl(invitation)
    const updatedInvitationUrl = (parsedUrl.query.oobUrl as string | undefined) ?? invitation

    // Try to parse the invitation as an DIDComm invitation.
    // We can't know for sure, as it could be a shortened URL to a DIDComm invitation.
    // So we use the parseMessage from credo and see if this returns a valid message.
    // Parse invitation supports legacy connection invitations, oob invitations, and
    // legacy connectionless invitations, and will all transform them into an OOB invitation.
    const parsedInvitation = await paradym.agent.modules.outOfBand.parseInvitation(updatedInvitationUrl)
    paradym.logger.debug(`Parsed didcomm invitation with id ${parsedInvitation.id}`)
    return parsedInvitation
  }
  return parseInvitationJson(invitation)
}

export async function parseOpenIdCredentialOfferInvitation(paradym: ParadymWalletSdk, invitationUrl: string) {
  const { resolvedCredentialOffer } = await resolveCredentialOffer({
    paradym,
    offer: { uri: invitationUrl },
  })
  const tokenResponse = await acquirePreAuthorizedAccessToken({ agent: paradym.agent, resolvedCredentialOffer })
  const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
    agent: paradym.agent,
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

export async function parseOpenIdPresentationRequestInvitation(paradym: ParadymWalletSdk, invitationUrl: string) {
  const resolved = await paradym.agent.modules.openId4VcHolder.resolveOpenId4VpAuthorizationRequest(invitationUrl)

  const formattedSubmission = getFormattedSubmission(resolved)

  // The output of this should be the input into the `shareProof` method

  return {
    id: 'TODO',
    formattedSubmission,
  }
}

// TODO(sdk): this, or another version of this method, cannot depend on the paradym instance for deeplink redirecting
export async function parseInvitationUrl(paradym: ParadymWalletSdk, invitationUrl: string): Promise<InvitationResult> {
  if (isOpenIdCredentialOffer(invitationUrl)) {
    const metadata = await parseOpenIdCredentialOfferInvitation(paradym, invitationUrl)

    return {
      __internal: { id: metadata.id },
      openId4VcCredentialOffer: {
        display: metadata.display,
      },
    }
  }

  if (isOpenIdPresentationRequest(invitationUrl)) {
    const { formattedSubmission, id } = await parseOpenIdPresentationRequestInvitation(paradym, invitationUrl)

    return {
      __internal: { id },
      openId4VcPresentationRequest: { formattedSubmission },
    }
  }

  if (isDidCommInvitation(invitationUrl)) {
    const outOfBandInvitation = await parseDidCommInvitation(paradym, invitationUrl)

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
    return await fetchInvitationDataUrl(paradym, invitationUrl)
  }

  throw new ParadymWalletInvitationNotRecognizedError()
}
