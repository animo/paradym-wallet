import type { OnWalletAuthSubmitProps } from '@easypid/components/WalletFlowAuthPrompt'
import { useDevelopmentMode, useOverAskingAi } from '@easypid/hooks'
import { useSubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import { authorizeWalletFlowIfNeeded, clearWalletFlowAuthorization } from '@easypid/utils/authorizeWalletFlow'
import { formatPredicate } from '@easypid/utils/formatePredicate'
import { useLingui } from '@lingui/react/macro'
import { usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type { CredentialsForProofRequest, FormattedSubmissionEntrySatisfied } from '@paradym/wallet-sdk'
import {
  type FormattedTransactionData,
  getDisclosedAttributeNamesForDisplay,
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  useParadym,
} from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'

type Query = { uri: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const { t } = useLingui()
  const { paradym } = useParadym('unlocked')

  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const [errorReason, setErrorReason] = useState<string>()

  const [resolvedRequest, setResolvedRequest] = useState<CredentialsForProofRequest>()
  const [formattedTransactionData, _setFormattedTransactionData] = useState<FormattedTransactionData>()
  const [isSharing, setIsSharing] = useState(false)
  const authorizationMode = useSubmissionAuthorizationMode(resolvedRequest?.formattedSubmission)

  const handleError = useCallback(({ reason, description }: { reason: string; description?: string }) => {
    setIsSharing(false)
    setErrorReason(description ? `${reason}\n${description}` : reason)
    return
  }, [])

  const reasonNoCredentials = t({
    id: 'presentation.noCredentialsSelected',
    message: 'No credentials selected',
    comment: 'Shown when the user tries to accept a proof but no credentials are loaded',
  })

  const reasonPinAuthFailed = t({
    id: 'presentation.pinAuthFailed',
    message: 'PIN authentication failed',
    comment: 'Shown when PIN is required but not provided',
  })

  const reasonAuthFailed = t({
    id: 'presentation.authFailed',
    message: 'Authentication failed',
    comment: 'Shown when authentication with PIN fails for other reasons',
  })

  useEffect(() => {
    if (resolvedRequest) return

    paradym.openid4vc
      .resolveCredentialRequest({
        uri: params.uri,
      })
      .then((r) => setResolvedRequest(r))
      .catch((error) => {
        const errorMessage =
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined

        handleError({
          reason: t(commonMessages.presentationInformationCouldNotBeExtracted),
          description: errorMessage,
        })
      })
  }, [resolvedRequest, params.uri, paradym.openid4vc, isDevelopmentModeEnabled, handleError, t])

  const { checkForOverAsking, isProcessingOverAsking, overAskingResponse, stopOverAsking } = useOverAskingAi()

  useEffect(() => {
    if (!resolvedRequest?.formattedSubmission || !resolvedRequest?.formattedSubmission.areAllSatisfied) {
      return
    }

    if (isProcessingOverAsking || overAskingResponse) {
      // Already generating or already has result
      return
    }

    const submission = resolvedRequest.formattedSubmission
    const requestedCards = submission.entries
      .filter((entry): entry is FormattedSubmissionEntrySatisfied => entry.isSatisfied)
      .flatMap((entry) => entry.credentials)

    void checkForOverAsking({
      verifier: {
        name: resolvedRequest.verifier.name ?? 'No name provided',
        domain: resolvedRequest.verifier.hostName ?? 'No domain provided',
      },
      name: submission.name ?? 'No name provided',
      purpose: submission.purpose ?? 'No purpose provided',
      cards: requestedCards.map((credential) => ({
        name: credential.credential.display.name ?? 'Card name',
        subtitle: credential.credential.display.description ?? 'Card description',
        requestedAttributes: getDisclosedAttributeNamesForDisplay(credential).map((c) =>
          typeof c === 'string' ? c : formatPredicate(c)
        ),
      })),
    })
  }, [resolvedRequest, checkForOverAsking, isProcessingOverAsking, overAskingResponse])

  const onProofAccept = useCallback(
    async ({ pin, onAuthorized, onAuthorizationError }: OnWalletAuthSubmitProps = {}) => {
      stopOverAsking()
      if (!resolvedRequest) return handleError({ reason: reasonNoCredentials })

      setIsSharing(true)

      try {
        await authorizeWalletFlowIfNeeded({
          mode: authorizationMode,
          pin,
          route: '/notifications/openIdPresentation',
        })
      } catch (e) {
        setIsSharing(false)
        clearWalletFlowAuthorization()
        if (e instanceof ParadymWalletAuthenticationInvalidPinError) {
          onAuthorizationError?.()
          toast.show(t(commonMessages.invalidPinEntered), {
            customData: {
              preset: 'danger',
            },
          })
          return
        }

        if (e instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          return handleError({
            reason: t(commonMessages.biometricAuthenticationCancelled),
          })
        }

        return handleError({
          reason: authorizationMode === 'pin-only' && !pin ? reasonPinAuthFailed : reasonAuthFailed,
          description:
            e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
        })
      }

      try {
        await paradym.openid4vc.shareCredentials({
          resolvedRequest,
          selectedCredentials: {},
          acceptTransactionData: formattedTransactionData?.type === 'qes_authorization',
        })

        onAuthorized?.()
      } catch (error) {
        setIsSharing(false)
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          return handleError({
            reason: t(commonMessages.biometricAuthenticationCancelled),
          })
        }

        paradym.logger.error('Error accepting presentation', {
          error,
        })

        return handleError({
          reason: t(commonMessages.presentationCouldNotBeShared),
          description:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
        })
      } finally {
        clearWalletFlowAuthorization()
      }
    },
    [
      resolvedRequest,
      paradym,
      authorizationMode,
      stopOverAsking,
      toast,
      isDevelopmentModeEnabled,
      handleError,
      formattedTransactionData,
      reasonNoCredentials,
      reasonPinAuthFailed,
      t,
      reasonAuthFailed,
    ]
  )

  const onProofDecline = useCallback(async () => {
    stopOverAsking()
    clearWalletFlowAuthorization()
    if (resolvedRequest) {
      await paradym.openid4vc.declineCredentialRequest({ resolvedRequest })
    }

    pushToWallet()
    toast.show(t(commonMessages.informationRequestDeclined), {
      customData: { preset: 'danger' },
    })
  }, [resolvedRequest, pushToWallet, stopOverAsking, t, toast, paradym])

  const replace = useCallback(() => {
    clearWalletFlowAuthorization()
    pushToWallet()
  }, [pushToWallet])

  return (
    <FunkePresentationNotificationScreen
      key="presentation"
      authorizationMode={authorizationMode ?? 'none'}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={resolvedRequest?.formattedSubmission}
      isAccepting={isSharing}
      entityId={resolvedRequest?.verifier.entityId}
      verifierName={resolvedRequest?.verifier.name}
      logo={resolvedRequest?.verifier.logo}
      trustedEntities={resolvedRequest?.verifier.trustedEntities}
      trustMechanism={resolvedRequest?.trustMechanism}
      onComplete={replace}
      onCancel={replace}
      overAskingResponse={overAskingResponse}
      transaction={formattedTransactionData}
      errorReason={errorReason}
    />
  )
}
