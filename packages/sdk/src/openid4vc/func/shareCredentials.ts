import {
  ClaimFormat,
  CredentialMultiInstanceUseMode,
  type DcqlCredentialsForRequest,
  type DcqlQueryResult,
  type DcqlValidCredential,
  type JsonObject,
  type MdocNameSpaces,
} from '@credo-ts/core'
import { Linking } from 'react-native'
import { assertAgentType } from '../../agent'
import { ParadymWalletBiometricAuthenticationError } from '../../error'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { pasoPaymentTransactionDataType } from '../../paso/paymentRulebook'
import { createPasoScaResponseClaims } from '../../paso/responseClaims'
import type { PasoAuthenticationMethod } from '../../paso/types'
import { activityStorage, storeSharedActivityForCredentialsForRequest } from '../../storage/activityStore'
import type { CredentialRecord } from '../../storage/credentials'
import type { CredentialsForProofRequest } from '../func/resolveCredentialRequest'
import { fetchPaymentTransactionStatus } from '../paymentTransactionStatus'
import { type FormattedTransactionData, resolveTransactionData } from '../transaction'

export type ShareCredentialsOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
  selectedCredentials: { [inputDescriptorId: string]: string }
  // FIXME: Should be a more complex structure allowing which credential to use for which entry
  acceptTransactionData?: boolean
  /**
   * The transaction the user was shown and consented to.
   *
   * Pass the value the consent screen rendered rather than letting this resolve its own: a PaSO
   * transaction involves fetching and verifying external resources, and re-resolving could produce
   * something other than what the user actually saw.
   */
  transactionData?: FormattedTransactionData
  /**
   * How the user released the transaction, for the `urn:paso:risk:global:amr:1` risk signal.
   *
   * Only reaches the proof when a risk signal profile or metadata enumeration requires that signal —
   * see [PaSO Risk Signal Registry] Section 2.8. Report only methods that were actually used: under
   * [PSD2] this is the evidence that two independent factor categories were involved.
   */
  authenticationMethods?: PasoAuthenticationMethod[]
  /** When the user completed that authentication, which Section 2.8 makes the signal's `collected_at`. */
  authenticatedAt?: Date
}

export const shareCredentials = async ({
  paradym,
  resolvedRequest,
  selectedCredentials,
  acceptTransactionData,
  transactionData: consentedTransactionData,
  authenticationMethods = ['hwk'],
  authenticatedAt = new Date(),
}: ShareCredentialsOptions) => {
  assertAgentType(paradym.agent, 'openid4vc')

  const { authorizationRequest } = resolvedRequest
  if (
    !resolvedRequest.credentialsForRequest?.areRequirementsSatisfied &&
    !resolvedRequest.queryResult?.can_be_satisfied
  ) {
    throw new Error('Requirements from proof request are not satisfied')
  }

  // Map all requirements and entries to a credential record. If a credential record for an
  // input descriptor has been provided in `selectedCredentials` we will use that. Otherwise
  // it will pick the first available credential.
  const presentationExchangeCredentials = resolvedRequest.credentialsForRequest
    ? Object.fromEntries(
        await Promise.all(
          resolvedRequest.credentialsForRequest.requirements.flatMap((requirement) =>
            requirement.submissionEntry.slice(0, requirement.needsCount).map(async (entry) => {
              const credentialId = selectedCredentials[entry.inputDescriptorId]
              const credential =
                entry.verifiableCredentials.find((vc) => vc.credentialRecord.id === credentialId) ??
                entry.verifiableCredentials[0]

              // NOTE: we don't support single-use credentials for PEX
              return [entry.inputDescriptorId, [credential]]
            })
          )
        )
      )
    : undefined

  const dcqlCredentials = resolvedRequest.queryResult
    ? Object.fromEntries(
        await Promise.all(
          Object.entries(
            Object.keys(selectedCredentials).length > 0
              ? // FIXME: this method should take into account w3c credentials
                getSelectedCredentialsForRequest(resolvedRequest.queryResult, selectedCredentials)
              : paradym.agent.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.queryResult, {
                  // FIXME: we currently allow re-sharing if we don't have new instances anymore
                  // we should make this configurable maybe? Or dependant on credential type?
                  useMode: CredentialMultiInstanceUseMode.NewOrFirst,
                })
          )
        )
      )
    : undefined

  const transactionData = consentedTransactionData ?? (await resolveTransactionData(paradym, resolvedRequest))

  // [PaSO Core] Section 6.2 — the SCA response claims are top-level claims of the KB-JWT, so they go
  // in as the presentation's additional payload. Credo merges this with the `transaction_data_hashes`
  // it adds itself, which is why `transaction_data_hash` below agrees with it by construction.
  if (transactionData?.type === pasoPaymentTransactionDataType && dcqlCredentials) {
    // Resolved without a card that can authorize it, so it was only ever shown to explain why. The
    // consent screen keeps its confirmation action out of reach in that state; reaching here anyway
    // would mean signing a transaction against metadata that was never verified.
    if (!transactionData.proof) {
      throw new Error('The PaSO transaction was resolved without a credential that can authorize it')
    }

    const presentations = dcqlCredentials[transactionData.cardForTransactionId]
    if (!presentations) {
      throw new Error(
        `Credential query '${transactionData.cardForTransactionId}' authorizes the PaSO transaction but is not part of the presentation`
      )
    }

    const scaResponseClaims = await createPasoScaResponseClaims({
      paradym,
      proof: transactionData.proof,
      // Safe: `resolvePasoTransactionData` rejects unsigned requests before we ever get here.
      signedRequest: resolvedRequest.signedAuthorizationRequest?.compact as string,
      responseMode:
        (authorizationRequest.response_mode as string | undefined) ?? (resolvedRequest.origin ? 'dc_api' : 'fragment'),
      authenticationMethods,
      authenticatedAt,
    })

    for (const presentation of presentations) {
      // Only SD-JWT VC carries a KB-JWT. The mdoc profile of [PaSO Core] Section 6.3 would need a
      // `urn:paso:sca:1` DeviceSigned namespace, which Credo has no path to produce.
      if (presentation.claimFormat !== ClaimFormat.SdJwtDc) continue
      presentation.additionalPayload = { ...presentation.additionalPayload, ...scaResponseClaims }
    }
  }

  try {
    const result = await paradym.agent.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
      authorizationRequestPayload: authorizationRequest,
      presentationExchange: presentationExchangeCredentials
        ? {
            credentials: presentationExchangeCredentials,
          }
        : undefined,
      dcql: dcqlCredentials
        ? {
            credentials: dcqlCredentials,
          }
        : undefined,
      transactionData:
        resolvedRequest.transactionData && acceptTransactionData && transactionData?.cardForTransactionId
          ? [{ credentialId: transactionData.cardForTransactionId }]
          : undefined,
      origin: resolvedRequest.origin,
    })

    // if redirect_uri is provided, open it in the browser
    // Even if the response returned an error, we must open this uri
    if (result.redirectUri) {
      await Linking.openURL(result.redirectUri)
    }

    if (result.serverResponse && (result.serverResponse.status < 200 || result.serverResponse.status > 299)) {
      paradym.logger.error('Error while accepting authorization request', {
        authorizationRequest,
        response: result.authorizationResponse,
        responsePayload: result.authorizationResponsePayload,
      })
      throw new Error(
        `Error while accepting authorization request. ${JSON.stringify(result.serverResponse.body, null, 2)}`
      )
    }

    const storedActivity = await storeSharedActivityForCredentialsForRequest(
      paradym,
      resolvedRequest,
      'success',
      transactionData
    )

    if (
      storedActivity.type === 'payment' &&
      (transactionData?.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1' ||
        transactionData?.type === pasoPaymentTransactionDataType) &&
      transactionData.cardForTransactionId
    ) {
      const credentialEntry = resolvedRequest.formattedSubmission.entries.find(
        (entry) => entry.inputDescriptorId === transactionData.cardForTransactionId && entry.isSatisfied
      )
      const credentialRecord = credentialEntry?.isSatisfied
        ? credentialEntry.credentials[0]?.credential.record
        : undefined
      if (credentialRecord) {
        fetchPaymentTransactionStatus(credentialRecord, transactionData.hash)
          .then((transactionStatus) => {
            if (transactionStatus) {
              return activityStorage.updateActivity(paradym.agent, storedActivity.id, { transactionStatus })
            }
          })
          .catch((error) => paradym.logger.error('Failed to fetch initial payment transaction status', { error }))
      }
    }

    return result
  } catch (error) {
    // Handle biometric authentication errors
    throw ParadymWalletBiometricAuthenticationError.tryParseFromError(error) ?? error
  }
}

/**
 * Selects the credentials to use based on the output from `getCredentialsForRequest`
 * Use this method if you don't want to manually select the credentials yourself.
 */
function getSelectedCredentialsForRequest(
  dcqlQueryResult: DcqlQueryResult,
  selectedCredentials: { [credentialQueryId: string]: string }
): DcqlCredentialsForRequest {
  if (!dcqlQueryResult.can_be_satisfied) {
    throw new Error('Cannot select the credentials for the dcql query presentation if the request cannot be satisfied')
  }

  const credentials: DcqlCredentialsForRequest = {}

  type WithRecord<T> = T & {
    record: CredentialRecord
  }

  for (const [credentialQueryId, credentialRecordId] of Object.entries(selectedCredentials)) {
    const matchesForCredentialQuery = dcqlQueryResult.credential_matches[credentialQueryId]
    if (matchesForCredentialQuery.success) {
      const validCredentialMatch = matchesForCredentialQuery.valid_credentials.find(
        (credential) => (credential as WithRecord<typeof credential>).record.id === credentialRecordId
      )

      if (!validCredentialMatch) {
        throw new Error(
          `Could not find credential record ${credentialRecordId} in valid credential matches for credentialQueryId ${credentialQueryId}`
        )
      }

      // TODO: make selection in Credo easier. `find` loses the Credo type of the match, which
      // has the record and the disclosed paths.
      const matchWithRecord = validCredentialMatch as DcqlValidCredential

      if (matchWithRecord.record.type === 'MdocRecord') {
        credentials[credentialQueryId] = [
          {
            claimFormat: ClaimFormat.MsoMdoc,
            credentialRecord: matchWithRecord.record,
            disclosedPayload: matchWithRecord.claims.valid_claim_sets[0].output as MdocNameSpaces,
            // FIXME: we currently allow re-sharing if we don't have new instances anymore
            // we should make this configurable maybe? Or dependant on credential type?
            useMode: CredentialMultiInstanceUseMode.NewOrFirst,
          },
        ]
      } else if (matchWithRecord.record.type === 'SdJwtVcRecord') {
        const [{ output, disclosed_paths }] = matchWithRecord.claims.valid_claim_sets

        credentials[credentialQueryId] = [
          {
            claimFormat: ClaimFormat.SdJwtDc,
            credentialRecord: matchWithRecord.record,
            // The paths the share screen shows and the activity stores, when Credo gives them
            ...(disclosed_paths
              ? { disclosedPaths: disclosed_paths, disclosedPayload: output as JsonObject }
              : { disclosedPayload: output as JsonObject }),
            // FIXME: we currently allow re-sharing if we don't have new instances anymore
            // we should make this configurable maybe? Or dependant on credential type?
            useMode: CredentialMultiInstanceUseMode.NewOrFirst,
          },
        ]
      }
    }
  }

  return credentials
}
