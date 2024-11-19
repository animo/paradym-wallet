import {
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  OpenId4VciAuthorizationFlow,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
  acquireAuthorizationCodeAccessToken,
  acquireAuthorizationCodeUsingPresentation,
  acquirePreAuthorizedAccessToken,
  extractOpenId4VcCredentialMetadata,
  getCredentialForDisplay,
  getCredentialsForProofRequest,
  getOpenId4VcCredentialDisplay,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  shareProof,
  storeCredential,
} from '@package/agent'

import { useAppAgent } from '@easypid/agent'

import { SlideWizard, usePushToWallet } from '@package/app'
import { useCallback, useEffect, useState } from 'react'
import { createParam } from 'solito'
import { addReceivedActivity, useActivities } from '../activity/activityRecord'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'
import { AuthCodeFlowSlide } from './slides/AuthCodeFlowSlide'
import { CredentialCardSlide } from './slides/CredentialCardSlide'
import { CredentialErrorSlide } from './slides/CredentialErrorSlide'
import { CredentialRetrievalSlide } from './slides/CredentialRetrievalSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { TxCodeSlide } from './slides/TxCodeSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type Query = { uri?: string; data?: string }

// TODO: clientId
const authorization = {
  clientId: 'wallet',
  redirectUri: 'id.animo.ausweis:///wallet/redirect',
}

const { useParams } = createParam<Query>()

export function FunkeCredentialNotificationScreen() {
  const { agent } = useAppAgent()
  const { params } = useParams()

  const pushToWallet = usePushToWallet()

  const [errorReason, setErrorReason] = useState<string>()
  const [isCompleted, setIsCompleted] = useState(false)

  const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<OpenId4VciResolvedCredentialOffer>()
  const [resolvedAuthorizationRequest, setResolvedAuthorizationRequest] =
    useState<OpenId4VciResolvedAuthorizationRequest>()

  const [isSharingPresentation, setIsSharingPresentation] = useState(false)
  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()

  // TODO: where to transform?
  // Combine oid4vci issuer metadata and openid fed into one pipeline. If openid it's trusted
  const issuerMetadata = resolvedCredentialOffer?.metadata.credentialIssuer
  const configuration =
    resolvedCredentialOffer?.offeredCredentialConfigurations[
      // TODO: handle empty configuration ids
      resolvedCredentialOffer.credentialOfferPayload.credential_configuration_ids[0]
    ]
  const credentialDisplay =
    configuration && issuerMetadata
      ? getOpenId4VcCredentialDisplay(
          extractOpenId4VcCredentialMetadata(configuration, {
            display: issuerMetadata?.display,
            id: issuerMetadata?.credential_issuer,
          })
        )
      : undefined
  if (credentialDisplay && !credentialDisplay.name) {
    credentialDisplay.name = 'Credential'
  }

  const preAuthGrant =
    resolvedCredentialOffer?.credentialOfferPayload.grants?.['urn:ietf:params:oauth:grant-type:pre-authorized_code']
  const txCode = preAuthGrant?.tx_code
  const { activities } = useActivities({ filters: { entityId: issuerMetadata?.credential_issuer } })

  // TODO: add issuer metadata
  // const issuerMetadata = useMemo(
  //   () => getOpenIdFedIssuerMetadata(authCodeFlowDetails?.domain as string),
  //   [authCodeFlowDetails?.domain]
  // )

  useEffect(() => {
    resolveOpenId4VciOffer({ agent, offer: params, authorization })
      .then(({ resolvedAuthorizationRequest, resolvedCredentialOffer }) => {
        setResolvedCredentialOffer(resolvedCredentialOffer)
        setResolvedAuthorizationRequest(resolvedAuthorizationRequest)
      })
      .catch((error) => {
        agent.config.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
        setErrorReason('Credential information could not be extracted')
      })
  }, [params, agent])

  const retrieveCredentials = useCallback(
    async (
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer,
      tokenResponse: OpenId4VciRequestTokenResponse,
      resolvedAuthorizationRequest?: OpenId4VciResolvedAuthorizationRequest
    ) => {
      const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
        agent,
        resolvedCredentialOffer,
        accessToken: tokenResponse,
        clientId: resolvedAuthorizationRequest ? authorization.clientId : undefined,
      })

      const credentialRecord = credentialResponses[0].credential
      const { display } = getCredentialForDisplay(credentialRecord)
      await storeCredential(agent, credentialRecord)
      await addReceivedActivity(agent, {
        // TODO: should entity id be the `iss` of the credential, or the oid4vci issuer?
        entityId: resolvedCredentialOffer?.metadata.credentialIssuer.credential_issuer,
        host: display.issuer.domain,
        name: display.issuer.name,
        logo: display.issuer.logo ? display.issuer.logo : undefined,
        backgroundColor: '#ffffff', // Default to a white background for now
        credentialIds: [credentialRecord.id],
      })
      setIsCompleted(true)
    },
    [agent]
  )

  const acquireCredentialsAuth = useCallback(
    async (authorizationCode: string) => {
      if (!resolvedCredentialOffer || !resolvedAuthorizationRequest) {
        setErrorReason('Credential information could not be extracted')
        return
      }
      try {
        const tokenResponse = await acquireAuthorizationCodeAccessToken({
          agent,
          resolvedCredentialOffer,
          redirectUri: authorization.redirectUri,
          authorizationCode,
          clientId: authorization.clientId,
          codeVerifier:
            'codeVerifier' in resolvedAuthorizationRequest ? resolvedAuthorizationRequest.codeVerifier : undefined,
        })

        await retrieveCredentials(resolvedCredentialOffer, tokenResponse, resolvedAuthorizationRequest)
      } catch (error) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReason('Error while retrieving credentials')
      }
    },
    [resolvedCredentialOffer, resolvedAuthorizationRequest, retrieveCredentials, agent]
  )

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string) => {
      if (!resolvedCredentialOffer) {
        setErrorReason('Credential information could not be extracted')
        return
      }

      try {
        const tokenResponse = await acquirePreAuthorizedAccessToken({
          agent,
          resolvedCredentialOffer,
          txCode,
        })
        await retrieveCredentials(resolvedCredentialOffer, tokenResponse)
      } catch (error) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReason('Error while retrieving credentials')
      }
    },
    [resolvedCredentialOffer, agent, retrieveCredentials]
  )

  const parsePresentationRequestUrl = useCallback(
    (oid4vpRequestUrl: string) =>
      getCredentialsForProofRequest({
        agent,
        uri: oid4vpRequestUrl,
        allowUntrustedCertificates: true,
      })
        .then(setCredentialsForRequest)
        .catch((error) => {
          setErrorReason('Presentation information could not be extracted.')
          agent.config.logger.error('Error getting credentials for request', {
            error,
          })
        }),
    [agent]
  )

  const onCheckCardContinue = useCallback(async () => {
    if (preAuthGrant && !preAuthGrant.tx_code) {
      await acquireCredentialsPreAuth()
    }
    if (resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance) {
      await parsePresentationRequestUrl(resolvedAuthorizationRequest.oid4vpRequestUrl)
    }
  }, [acquireCredentialsPreAuth, parsePresentationRequestUrl, preAuthGrant, resolvedAuthorizationRequest])

  const onSubmitTxCode = useCallback(
    async (txCode: string) => {
      await acquireCredentialsPreAuth(txCode)
    },
    [acquireCredentialsPreAuth]
  )

  const onPresentationAccept = useCallback(async () => {
    if (
      !credentialsForRequest ||
      !resolvedCredentialOffer ||
      !resolvedAuthorizationRequest ||
      resolvedAuthorizationRequest.authorizationFlow !== OpenId4VciAuthorizationFlow.PresentationDuringIssuance
    ) {
      setErrorReason('Presentation information could not be extracted.')
      return
    }

    setIsSharingPresentation(true)

    try {
      const { presentationDuringIssuanceSession } = await shareProof({
        agent,
        authorizationRequest: credentialsForRequest.authorizationRequest,
        credentialsForRequest: credentialsForRequest.credentialsForRequest,
        selectedCredentials: {},
        allowUntrustedCertificate: true,
      })

      const { authorizationCode } = await acquireAuthorizationCodeUsingPresentation({
        resolvedCredentialOffer,
        authSession: resolvedAuthorizationRequest.authSession,
        presentationDuringIssuanceSession,
        agent,
      })

      await acquireCredentialsAuth(authorizationCode)

      setIsSharingPresentation(false)
    } catch (error) {
      setIsSharingPresentation(false)
      if (error instanceof BiometricAuthenticationCancelledError) {
        setErrorReason('Biometric authentication cancelled')
        return
      }

      agent.config.logger.error('Error accepting presentation', {
        error,
      })
      setErrorReason('Presentation could not be shared.')
    }
  }, [credentialsForRequest, agent, acquireCredentialsAuth, resolvedAuthorizationRequest, resolvedCredentialOffer])

  const onCancel = () => pushToWallet('back')
  const onGoToWallet = () => pushToWallet('replace')

  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 16.5,
          screen: () => (
            <LoadingRequestSlide key="loading-request" isLoading={!resolvedCredentialOffer} isError={!!errorReason} />
          ),
        },
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: () => (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={credentialDisplay?.issuer?.name}
              logo={credentialDisplay?.issuer?.logo}
              host={credentialDisplay?.issuer?.domain as string}
              entityId={issuerMetadata?.credential_issuer as string}
              lastInteractionDate={activities[0]?.date}
              approvalsCount={0}
            />
          ),
        },
        {
          step: 'check-card',
          progress: 49.5,
          screen: () => (
            <CredentialCardSlide key="credential-card" display={credentialDisplay} onContinue={onCheckCardContinue} />
          ),
        },
        resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance
          ? {
              step: 'presentation-during-issuance',
              progress: 49.5,
              backIsCancel: true,
              screen: () =>
                credentialsForRequest ? (
                  <ShareCredentialsSlide
                    key="share-credentials"
                    // TODO: add user pin
                    onAccept={onPresentationAccept}
                    onDecline={() => {}}
                    // TODO:
                    // logo={}
                    submission={credentialsForRequest?.formattedSubmission}
                    isAccepting={isSharingPresentation}
                  />
                ) : null,
            }
          : undefined,
        // Only when doing pre auth and we need to enter a tx code (pin)
        preAuthGrant && txCode
          ? {
              step: 'tx-code',
              progress: 49.5,
              backIsCancel: true,
              screen: () => <TxCodeSlide txCode={txCode} onTxCode={onSubmitTxCode} />,
            }
          : undefined,
        // Only when doing browser auth
        resolvedCredentialOffer &&
        resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.Oauth2Redirect
          ? {
              step: 'auth-code-flow',
              progress: 49.5,
              backIsCancel: true,
              screen: () => (
                <AuthCodeFlowSlide
                  key="auth-code-flow"
                  authCodeFlowDetails={{
                    openUrl: resolvedAuthorizationRequest.authorizationRequestUrl,
                    redirectUri: authorization.redirectUri,
                    domain: resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
                  }}
                  onAuthFlowCallback={acquireCredentialsAuth}
                  onCancel={() => {
                    setErrorReason('Authorization cancelled')
                  }}
                  onError={() => {
                    setErrorReason('Authorization failed')
                  }}
                />
              ),
            }
          : undefined,
        {
          step: 'retrieve-credential',
          progress: 66,
          backIsCancel: true,
          screen: () => (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onGoToWallet}
              display={credentialDisplay}
              isCompleted={isCompleted}
            />
          ),
        },
      ].filter((v): v is Exclude<typeof v, undefined> => v !== undefined)}
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={errorReason !== undefined}
      onCancel={onCancel}
    />
  )
}
