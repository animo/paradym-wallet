import { useDevelopmentMode, useOverAskingAi } from '@app/hooks'
import { formatPredicate } from '@app/utils/formatePredicate'
import { useLingui } from '@lingui/react/macro'
import { usePushToWallet } from '@package/app'
import { commonMessages, useLocale } from '@package/translations'
import { useToastController } from '@package/ui'
import type { CredentialsForProofRequest, FormattedSubmissionEntrySatisfied } from '@paradym/wallet-sdk'
import {
  type FormattedTransactionData,
  getDisclosedAttributeNamesForDisplay,
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletPasoError,
  resolveTransactionData,
  useParadym,
} from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { PresentationNotificationScreen } from './PresentationNotificationScreen'
import { resolvePasoAuthenticationMethods } from './pasoAuthenticationMethods'
import { usePasoRefusalMessage } from './pasoRefusalMessage'
import type { OnPinSubmitProps } from './slides/PinSlide'

type Query = { uri: string }

export function OpenIdPresentationNotificationScreen() {
  const { t } = useLingui()
  const locale = useLocale()
  const { paradym } = useParadym('unlocked')

  const toast = useToastController()
  const pasoRefusalMessage = usePasoRefusalMessage()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const [errorReason, setErrorReason] = useState<string>()

  const [resolvedRequest, setResolvedRequest] = useState<CredentialsForProofRequest>()
  const [formattedTransactionData, setFormattedTransactionData] = useState<FormattedTransactionData>()
  const [isSharing, setIsSharing] = useState(false)
  const shouldUsePin = useShouldUsePinForSubmission(resolvedRequest?.formattedSubmission)

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

  // request_uri in OpenID4VP is one-shot on the verifier side, so we must guarantee a single
  // resolve per uri across re-renders and React's dev-mode double-invoked effects.
  const resolvingUriRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (resolvedRequest || resolvingUriRef.current === params.uri) return
    resolvingUriRef.current = params.uri

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

  useEffect(() => {
    if (!resolvedRequest) return

    let isCurrent = true
    resolveTransactionData(paradym, resolvedRequest, locale)
      .then((transaction) => {
        if (isCurrent) setFormattedTransactionData(transaction)
      })
      .catch((error) => {
        if (!isCurrent) return

        // A PaSO refusal is a decision, not a failure: the spec asks the wallet to say which rule it
        // could not satisfy, so the user knows whether to retry or give up.
        if (error instanceof ParadymWalletPasoError) {
          return handleError({ reason: pasoRefusalMessage(error.code) })
        }

        const errorMessage =
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined
        handleError({
          reason: t(commonMessages.presentationInformationCouldNotBeExtracted),
          description: errorMessage,
        })
      })

    return () => {
      isCurrent = false
    }
  }, [resolvedRequest, paradym, locale, handleError, isDevelopmentModeEnabled, pasoRefusalMessage, t])

  const { checkForOverAsking, isProcessingOverAsking, overAskingResponse, stopOverAsking } = useOverAskingAi()

  useEffect(() => {
    if (!resolvedRequest?.formattedSubmission?.areAllSatisfied) {
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
    async ({ pin, onPinComplete, onPinError }: OnPinSubmitProps = {}) => {
      stopOverAsking()
      if (!resolvedRequest) return handleError({ reason: reasonNoCredentials })

      setIsSharing(true)

      if (shouldUsePin) {
        if (!pin) {
          setIsSharing(false)
          return handleError({ reason: reasonPinAuthFailed })
        }

        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (e) {
          setIsSharing(false)
          if (e instanceof ParadymWalletAuthenticationInvalidPinError) {
            onPinError?.()
            toast.show(t(commonMessages.invalidPinEntered), {
              customData: {
                preset: 'danger',
              },
            })
            return
          }

          return handleError({
            reason: reasonAuthFailed,
            description:
              e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
          })
        }
      }

      // Everything the user had to do to release this transaction is now behind us, which is what
      // [PaSO Risk Signal Registry] Section 2.8 wants both of these to describe.
      const authenticatedAt = new Date()
      const authenticationMethods = resolvePasoAuthenticationMethods({ usedTransactionPin: shouldUsePin === true })

      try {
        await paradym.openid4vc.shareCredentials({
          resolvedRequest,
          selectedCredentials: {},
          transactionData: formattedTransactionData,
          acceptTransactionData: formattedTransactionData !== undefined,
          authenticationMethods,
          authenticatedAt,
        })

        onPinComplete?.()
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
      }
    },
    [
      resolvedRequest,
      paradym,
      shouldUsePin,
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
    if (resolvedRequest) {
      // The transaction goes along so the declined activity records what was turned down. Resolving
      // a PaSO transaction is asynchronous, so leaving this out would record the refusal of a
      // payment as the refusal of a bare information request.
      await paradym.openid4vc.declineCredentialRequest({
        resolvedRequest,
        transactionData: formattedTransactionData,
      })
    }

    pushToWallet()
    toast.show(t(commonMessages.informationRequestDeclined), {
      customData: { preset: 'danger' },
    })
  }, [resolvedRequest, pushToWallet, stopOverAsking, t, toast, paradym, formattedTransactionData])

  const replace = useCallback(() => pushToWallet(), [pushToWallet])

  return (
    <PresentationNotificationScreen
      key="presentation"
      usePin={shouldUsePin ?? false}
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
