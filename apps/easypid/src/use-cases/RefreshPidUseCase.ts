import { ClaimFormat, Kms, MdocRecord, SdJwtVcRecord } from '@credo-ts/core'
import { dcApiRegisterOptions } from '@easypid/utils/dcApiRegisterOptions'
import {
  acquireRefreshTokenAccessToken,
  type CredentialRecord,
  getCredentialCategoryMetadata,
  getOpenId4VcCredentialMetadata,
  getRefreshCredentialMetadata,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedCredentialOffer,
  type ParadymWalletSdk,
  receiveCredentialFromOpenId4VciOffer,
  setOpenId4VcCredentialMetadata,
  updateCredential,
} from '@paradym/wallet-sdk'
import { pidSchemes } from '../constants'
import { C_PRIME_SD_JWT_MDOC_OFFER } from './bdrPidIssuerOffers'
import { ReceivePidUseCaseFlow } from './ReceivePidUseCaseFlow'

export interface RefreshPidUseCaseOptions {
  paradym: ParadymWalletSdk
}

export class RefreshPidUseCase {
  protected options: RefreshPidUseCaseOptions

  public resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  protected accessToken?: OpenId4VciRequestTokenResponse

  static REDIRECT_URI = ReceivePidUseCaseFlow.REDIRECT_URI
  static CLIENT_ID = ReceivePidUseCaseFlow.CLIENT_ID

  public static async initialize(options: RefreshPidUseCaseOptions) {
    const resolved = await options.paradym.openid4vc.resolveCredentialOffer({
      offerUri: C_PRIME_SD_JWT_MDOC_OFFER,
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
    batchSize = 2,
  }: {
    sdJwt?: SdJwtVcRecord
    mdoc?: MdocRecord
    batchSize?: number
  }) {
    const existingRefreshMetadata =
      (sdJwt ? getRefreshCredentialMetadata(sdJwt) : undefined) ??
      (mdoc ? getRefreshCredentialMetadata(mdoc) : undefined)

    if (!existingRefreshMetadata) {
      throw new Error('Refresh metadata must be available for refresh')
    }

    const accessToken = await acquireRefreshTokenAccessToken({
      paradym: this.options.paradym,
      clientId: ReceivePidUseCaseFlow.CLIENT_ID,
      resolvedCredentialOffer: this.resolvedCredentialOffer,
      authorizationServer: this.resolvedCredentialOffer.metadata.authorizationServers[0].issuer,
      refreshToken: existingRefreshMetadata?.refreshToken,
      dpop: existingRefreshMetadata?.dpop
        ? { alg: existingRefreshMetadata.dpop.alg, jwk: Kms.PublicJwk.fromUnknown(existingRefreshMetadata.dpop.jwk) }
        : undefined,
    })

    const limitToFormats: string[] = []
    if (mdoc) limitToFormats.push(ClaimFormat.MsoMdoc)
    // NOTE: BDR issuer still uses legacy vc+sd-jwt
    if (sdJwt) limitToFormats.push(ClaimFormat.SdJwtDc, 'vc+sd-jwt')

    const credentialConfigurationIdsToRequest = Object.entries(
      this.resolvedCredentialOffer.offeredCredentialConfigurations
    )
      .filter(([, configuration]) => limitToFormats.includes(configuration.format))
      .map(([id]) => id)

    const { credentials, deferredCredentials } = await receiveCredentialFromOpenId4VciOffer({
      paradym: this.options.paradym,
      accessToken,
      resolvedCredentialOffer: this.resolvedCredentialOffer,
      credentialConfigurationIdsToRequest,
      clientId: RefreshPidUseCase.CLIENT_ID,
      requestBatch: batchSize,
      pidSchemes,
    })

    if (deferredCredentials && deferredCredentials.length > 0) {
      throw new Error('Unexpected deferred credentials in refresh pid use case flow')
    }

    const credentialRecords: Array<SdJwtVcRecord | MdocRecord> = []
    for (const credentialResponse of credentials) {
      const credentialRecord = credentialResponse.credential

      if (credentialRecord.type !== 'SdJwtVcRecord' && credentialRecord.type !== 'MdocRecord') {
        throw new Error(`Unexpected record type ${credentialRecord.type}`)
      }

      const newOpenId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
      if (credentialRecord instanceof SdJwtVcRecord && sdJwt) {
        credentialRecords.push(sdJwt)

        sdJwt.credentialInstances = credentialRecord.credentialInstances
        sdJwt.typeMetadata = credentialRecord.typeMetadata

        if (newOpenId4VcMetadata) {
          setOpenId4VcCredentialMetadata(sdJwt, newOpenId4VcMetadata)
        }

        // Should we update the type metadata as well? For now we use hardcoded anyway
        await updateCredential(dcApiRegisterOptions({ paradym: this.options.paradym, credentialRecord: sdJwt }))
      } else if (credentialRecord instanceof MdocRecord && mdoc) {
        credentialRecords.push(mdoc)

        mdoc.credentialInstances = credentialRecord.credentialInstances
        if (newOpenId4VcMetadata) {
          setOpenId4VcCredentialMetadata(mdoc, newOpenId4VcMetadata)
        }

        await updateCredential(dcApiRegisterOptions({ paradym: this.options.paradym, credentialRecord: mdoc }))
      }
    }

    return credentialRecords
  }
}

export async function refreshPid({
  paradym,
  sdJwt,
  mdoc,
  batchSize,
}: {
  paradym: ParadymWalletSdk
  sdJwt?: SdJwtVcRecord
  mdoc?: MdocRecord
  batchSize?: number
}) {
  paradym.logger.info('refreshing PID')
  const useCase = await RefreshPidUseCase.initialize({
    paradym,
  })

  await useCase.retrieveCredentialsUsingExistingRecords({
    sdJwt,
    mdoc,
    batchSize,
  })
}

/**
 * If available, takes a credential from the batch.
 *
 * @todo this should be refactored since it only refreshes when
 * you use the cred, but this should actually happen continuously
 * so that also if it expires it is refreshed
 */
export async function refreshPidIfNeeded(paradym: ParadymWalletSdk, credentialRecord: CredentialRecord) {
  // Try to refresh the pid when we run out
  // TODO: we should probably move this somewhere else at some point
  const categoryMetadata = getCredentialCategoryMetadata(credentialRecord)
  const refreshMetadata = getRefreshCredentialMetadata(credentialRecord)
  if (
    categoryMetadata?.credentialCategory === 'DE-PID' &&
    refreshMetadata &&
    credentialRecord.credentialInstances.length === 1
  ) {
    refreshPid({
      paradym,
      sdJwt: credentialRecord.type === 'SdJwtVcRecord' ? credentialRecord : undefined,
      mdoc: credentialRecord.type === 'MdocRecord' ? credentialRecord : undefined,
      // Get a batch of 5 for a single record type
      batchSize: 5,
    })
      .catch((error) => {
        // TODO: we should handle the case where the refresh token is expired
        paradym.logger.error('Error refreshing pid', {
          error,
        })
      })
      .then(() => {
        paradym.logger.debug('Successfully refreshed PID')
      })
  }
}
