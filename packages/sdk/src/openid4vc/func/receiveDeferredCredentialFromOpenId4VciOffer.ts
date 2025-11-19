import type {
  OpenId4VciCredentialResponse,
  OpenId4VciDeferredCredentialResponse,
  OpenId4VciMetadata,
  OpenId4VciRequestTokenResponse,
} from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '@package/sdk'
import { ParadymWalletBiometricAuthenticationError } from '@paradym/wallet-sdk/error'
import {
  extractOpenId4VcCredentialMetadata,
  setBatchCredentialMetadata,
  setOpenId4VcCredentialMetadata,
} from '@paradym/wallet-sdk/metadata/credentials'

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
  try {
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
  } catch (error) {
    // TODO: if one biometric operation fails it will fail the whole credential receiving. We should have more control so we
    // can retry e.g. the second credential
    // Handle biometric authentication errors
    throw ParadymWalletBiometricAuthenticationError.tryParseFromError(error) ?? error
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
