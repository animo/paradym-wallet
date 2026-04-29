import type { OnWalletAuthSubmitProps } from '@easypid/components/WalletFlowAuthPrompt'
import { useDevelopmentMode } from '@easypid/hooks'
import { useSubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import { authorizeWalletFlowIfNeeded, clearWalletFlowAuthorization } from '@easypid/utils/authorizeWalletFlow'
import { useLingui } from '@lingui/react/macro'
import { usePushToWallet } from '@package/app/hooks/usePushToWallet'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type { FormattedSubmission } from '@paradym/wallet-sdk'
import {
  type ActivityStatus,
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  storeSharedActivityForCredentialsForRequest,
  useParadym,
} from '@paradym/wallet-sdk'
import { useCallback, useEffect, useState } from 'react'
import { shareDeviceResponse, shutdownDataTransfer } from '../proximity'
import { FunkeOfflineSharingScreen } from './FunkeOfflineSharingScreen'

type FunkeMdocOfflineSharingScreenProps = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
}

// Entry point for offline sharing with Mdoc
export function FunkeMdocOfflineSharingScreen({
  sessionTranscript,
  deviceRequest,
}: FunkeMdocOfflineSharingScreenProps) {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [submission, setSubmission] = useState<FormattedSubmission>()
  const [isProcessing, setIsProcessing] = useState(false)
  const authorizationMode = useSubmissionAuthorizationMode(submission)
  const { t } = useLingui()

  useEffect(() => {
    paradym.proximity
      .getSubmissionForMdocDocumentRequest({ encodedDeviceRequest: deviceRequest })
      .then(setSubmission)
      .catch((error) => {
        toast.show(t(commonMessages.presentationInformationCouldNotBeExtracted), {
          message:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
          customData: { preset: 'danger' },
        })
        paradym.logger.error('Error getting credentials for mdoc device request', {
          error,
        })

        pushToWallet()
      })
  }, [paradym, deviceRequest, toast.show, pushToWallet, isDevelopmentModeEnabled, t])

  const handleError = useCallback(
    ({ reason, description, redirect = true }: { reason: string; description?: string; redirect?: boolean }) => {
      toast.show(reason, { message: description, customData: { preset: 'danger' } })
      if (redirect) pushToWallet()
      return
    },
    [toast, pushToWallet]
  )

  const onProofAccept = async ({ pin, onAuthorized, onAuthorizationError }: OnWalletAuthSubmitProps = {}) => {
    // Already checked for submission in the useEffect
    if (!submission) return

    setIsProcessing(true)

    try {
      await authorizeWalletFlowIfNeeded({
        mode: authorizationMode,
        pin,
      })
    } catch (e) {
      setIsProcessing(false)
      clearWalletFlowAuthorization()
      if (e instanceof ParadymWalletAuthenticationInvalidPinError) {
        onAuthorizationError?.()
        return handleError({
          reason: t(commonMessages.invalidPinEntered),
          redirect: false,
        })
      }

      if (e instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        return handleError({
          reason: t(commonMessages.biometricAuthenticationCancelled),
          redirect: false,
        })
      }

      return handleError({
        reason: t({
          id: 'funkeMdoc.error.auth',
          message: 'Authentication Error',
          comment: 'Shown when there is a general auth error during offline flow',
        }),
        redirect: true,
        description:
          e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
      })
    }

    // Once this returns we just assume it's successful
    try {
      await shareDeviceResponse({
        paradym,
        deviceRequest,
        sessionTranscript,
        submission,
      })
    } catch (error) {
      if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        return handleError({
          reason: t(commonMessages.biometricAuthenticationCancelled),
          redirect: false,
        })
      }

      await addActivity('failed')
      return handleError({
        reason: t({
          id: 'funkeMdoc.error.sharing',
          message: 'Could not share device response',
          comment: 'Shown when shareDeviceResponse fails',
        }),
        redirect: true,
        description:
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
      })
    } finally {
      clearWalletFlowAuthorization()
      setIsProcessing(false)
    }

    await addActivity('success')

    onAuthorized?.()
  }

  const onProofDecline = async () => {
    setIsProcessing(true)
    clearWalletFlowAuthorization()

    await addActivity('stopped')

    setIsProcessing(false)

    shutdownDataTransfer()
    handleError({
      reason: t({
        id: 'funkeMdoc.proof.declined',
        message: 'Proof has been declined',
        comment: 'Shown when user declines sharing proof',
      }),
      redirect: true,
    })
  }

  const onProofComplete = () => {
    shutdownDataTransfer()
    pushToWallet()
  }

  const addActivity = async (status: Exclude<ActivityStatus, 'pending'>) => {
    if (!submission) return
    await storeSharedActivityForCredentialsForRequest(
      paradym,
      {
        formattedSubmission: submission,
        verifier: {
          hostName: undefined,
          logo: undefined,
          name: t(commonMessages.unknownOrganization),
          trustedEntities: [],
        },
      },
      status
    )
  }

  // FIXME: Consider re-using the regular flow with an isOffline flag
  return (
    <FunkeOfflineSharingScreen
      isAccepting={isProcessing}
      submission={submission}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      onComplete={onProofComplete}
      authorizationMode={authorizationMode ?? 'none'}
    />
  )
}
