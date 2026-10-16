import type {
  OpenId4VciCredentialResponse,
  OpenId4VciDeferredCredentialResponse,
  OpenId4VciMetadata,
  OpenId4VciRequestTokenResponse,
} from '@credo-ts/openid4vc'
import { assertAgentType } from '../../agent'
import {
  extractOpenId4VcCredentialMetadata,
  setBatchCredentialMetadata,
  setOpenId4VcCredentialMetadata,
} from '../../metadata/credentials'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'

export type ReceiveDeferredCredentialFromOpenId4VciOfferOptions = {
  paradym: ParadymWalletSdk
  deferredCredentialResponse: OpenId4VciDeferredCredentialResponse
  issuerMetadata: OpenId4VciMetadata
  // TODO: cNonce should maybe be provided separately (multiple calls can have different c_nonce values)
  accessToken: OpenId4VciRequestTokenResponse
}

export const receiveDeferredCredentialFromOpenId4VciOffer = async ({
  paradym,
  deferredCredentialResponse,
  issuerMetadata,
  accessToken,
}: ReceiveDeferredCredentialFromOpenId4VciOfferOptions) => {
  assertAgentType(paradym.agent, 'openid4vc')
  const { credentials, deferredCredentials } = await paradym.agent.openid4vc.holder.requestDeferredCredentials({
    ...deferredCredentialResponse,
    ...accessToken,
    issuerMetadata,
    verifyCredentialStatus: false,
  })

  return {
    deferredCredentials,
    credentials: parseCredentialResponses(credentials, issuerMetadata),
  }
}

const parseCredentialResponses = (credentials: OpenId4VciCredentialResponse[], issuerMetadata: OpenId4VciMetadata) =>
  credentials.map(({ record, ...credentialResponse }) => {
    // OpenID4VC metadata
    const openId4VcMetadata = extractOpenId4VcCredentialMetadata(credentialResponse.credentialConfiguration, {
      id: issuerMetadata.credentialIssuer.credential_issuer,
      display: issuerMetadata.credentialIssuer.display,
    })
    setOpenId4VcCredentialMetadata(record, openId4VcMetadata)

    // Match metadata
    if (credentials.length > 1) {
      setBatchCredentialMetadata(record, {
        additionalCredentials: credentials.slice(1).map((c) => c.record.encoded) as
          | Array<string>
          | Array<Record<string, unknown>>,
      })
    }

    return {
      ...credentialResponse,
      credential: record,
    }
  })
