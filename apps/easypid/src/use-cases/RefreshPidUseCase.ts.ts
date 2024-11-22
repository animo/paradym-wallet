import { ClaimFormat, MdocRecord, getJwkFromJson } from '@credo-ts/core'
import type { AppAgent } from '@easypid/agent'
import {
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedCredentialOffer,
  SdJwtVcRecord,
  acquireRefreshTokenAccessToken,
  getRefreshCredentialMetadata,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  setRefreshCredentialMetadata,
  storeCredential,
} from '@package/agent'
import { pidSchemes } from '../constants'
import { ReceivePidUseCaseFlow } from './ReceivePidUseCaseFlow'
import { C_PRIME_SD_JWT_MDOC_OFFER } from './bdrPidIssuerOffers'

export interface RefreshPidUseCaseOptions {
  agent: AppAgent
}

export class RefreshPidUseCase {
  protected options: RefreshPidUseCaseOptions

  public resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  protected accessToken?: OpenId4VciRequestTokenResponse

  static REDIRECT_URI = ReceivePidUseCaseFlow.REDIRECT_URI
  static CLIENT_ID = ReceivePidUseCaseFlow.CLIENT_ID

  public static async initialize(options: RefreshPidUseCaseOptions) {
    const resolved = await resolveOpenId4VciOffer({
      agent: options.agent,
      offer: { uri: C_PRIME_SD_JWT_MDOC_OFFER },
      fetchAuthorization: false,
    })

    if (!resolved.resolvedCredentialOffer.metadata.credentialIssuer.batch_credential_issuance) {
      // NOTE: the bdr pid issuer does not include in their metadata that they support batch while they do support is
      // and Credo checks for this. We modify the metadata so we can still use batch issuance
      resolved.resolvedCredentialOffer.metadata.credentialIssuer.batch_credential_issuance = {
        batch_size: 10,
      }
    }

    return new RefreshPidUseCase(options, resolved.resolvedCredentialOffer)
  }

  protected constructor(options: RefreshPidUseCaseOptions, resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer) {
    this.resolvedCredentialOffer = resolvedCredentialOffer
    this.options = options
  }

  public async retrieveCredentialsUsingExistingRecords({
    sdJwt,
    mdoc,
  }: {
    sdJwt?: SdJwtVcRecord
    mdoc?: MdocRecord
  }) {
    const existingRefreshMetadata =
      (sdJwt ? getRefreshCredentialMetadata(sdJwt) : undefined) ??
      (mdoc ? getRefreshCredentialMetadata(mdoc) : undefined)

    if (!existingRefreshMetadata) {
      throw new Error('Refresh metadata must be available for refresh')
    }

    const accessToken = await acquireRefreshTokenAccessToken({
      agent: this.options.agent,
      clientId: ReceivePidUseCaseFlow.CLIENT_ID,
      resolvedCredentialOffer: this.resolvedCredentialOffer,
      authorizationServer: this.resolvedCredentialOffer.metadata.authorizationServers[0].issuer,
      refreshToken: existingRefreshMetadata?.refreshToken,
      dpop: existingRefreshMetadata?.dpop
        ? { alg: existingRefreshMetadata.dpop.alg, jwk: getJwkFromJson(existingRefreshMetadata.dpop.jwk) }
        : undefined,
    })

    const limitToFormats: string[] = []
    if (mdoc) limitToFormats.push(ClaimFormat.MsoMdoc)
    if (sdJwt) limitToFormats.push(ClaimFormat.SdJwtVc)

    const credentialConfigurationIdsToRequest = Object.entries(
      this.resolvedCredentialOffer.offeredCredentialConfigurations
    )
      .filter(([, configuration]) => limitToFormats.includes(configuration.format))
      .map(([id]) => id)

    const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
      agent: this.options.agent,
      accessToken,
      resolvedCredentialOffer: this.resolvedCredentialOffer,
      credentialConfigurationIdsToRequest,
      clientId: RefreshPidUseCase.CLIENT_ID,
      requestBatch: 10,
      pidSchemes,
    })

    const credentialRecords: Array<SdJwtVcRecord | MdocRecord> = []
    for (const credentialResponse of credentialResponses) {
      const credentialRecord = credentialResponse.credential

      if (credentialRecord.type !== 'SdJwtVcRecord' && credentialRecord.type !== 'MdocRecord') {
        throw new Error(`Unexpected record type ${credentialRecord.type}`)
      }

      // No refresh token is issued for the refresh access token so we take the existing refresh metadata
      setRefreshCredentialMetadata(credentialRecord, existingRefreshMetadata)

      if (credentialRecord instanceof SdJwtVcRecord && sdJwt) {
        credentialRecords.push(credentialRecord)
        await storeCredential(this.options.agent, credentialRecord)
        await this.options.agent.sdJwtVc.deleteById(sdJwt.id)
      } else if (credentialRecord instanceof MdocRecord && mdoc) {
        credentialRecords.push(credentialRecord)
        await storeCredential(this.options.agent, credentialRecord)
        await this.options.agent.mdoc.deleteById(mdoc.id)
      }
    }

    return credentialRecords
  }
}
