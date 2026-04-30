import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { type FlowSelectedCredentials, SubmissionCredentialSets } from '@easypid/features/flow/SubmissionCredentialSets'
import {
  TransactionDataWidget,
  useTransactionDataPresentationLabels,
} from '@easypid/features/flow/TransactionDataRegistry'
import type { WalletFlowSource } from '@easypid/features/flow/WalletFlowShell'
import {
  getWalletFlowSurface,
  WalletFlowActionButton,
  WalletFlowErrorContent,
  WalletFlowShell,
} from '@easypid/features/flow/WalletFlowShell'
import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Paragraph, YStack } from '@package/ui'
import type { DisplayImage, FormattedSubmission, FormattedTransactionData } from '@paradym/wallet-sdk'
import { useState } from 'react'
import type { SubmissionAuthorizationMode } from '../../hooks/useSubmissionAuthorizationMode'

export type PresentationAcceptProps = OnWalletAuthSubmitProps & {
  selectedCredentials?: FlowSelectedCredentials
}

interface FunkePresentationNotificationScreenProps {
  entityId?: string
  verifierName?: string
  logo?: DisplayImage
  overAskingResponse?: OverAskingResponse
  submission?: FormattedSubmission
  authorizationMode: SubmissionAuthorizationMode
  isAccepting: boolean
  transaction?: FormattedTransactionData
  onAccept: (props?: PresentationAcceptProps) => Promise<void>
  onDecline: () => void
  onCancel: () => void
  onComplete: () => void
  errorReason?: string
  source?: WalletFlowSource
}

export function FunkePresentationNotificationScreen({
  entityId,
  verifierName,
  logo,
  authorizationMode,
  onAccept,
  onCancel,
  onDecline,
  isAccepting,
  submission,
  onComplete,
  overAskingResponse,
  transaction,
  errorReason,
  source = 'in-app',
}: FunkePresentationNotificationScreenProps) {
  const { t } = useLingui()
  const [selectedCredentials, setSelectedCredentials] = useState<FlowSelectedCredentials>({})
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isSubmitLocked, setIsSubmitLocked] = useState(false)
  const surface = getWalletFlowSurface(source)
  const endButtonLabel =
    surface === 'overlay'
      ? t(commonMessages.close)
      : t({
          id: 'presentation.onePage.done',
          message: 'Return to wallet',
          comment: 'Button label after a presentation is shared',
        })
  const isSubmitting = isAccepting || isSubmitLocked
  const transactionDataPresentation = useTransactionDataPresentationLabels(transaction ?? undefined)

  const complete = () => {
    setIsComplete(true)
    setIsAuthenticating(false)
  }

  const accept = async (props: PresentationAcceptProps = {}) => {
    if (isSubmitting) return

    setIsSubmitLocked(true)
    try {
      await onAccept({
        ...props,
        selectedCredentials,
        onAuthorized: () => {
          props.onAuthorized?.()
          complete()
        },
      })
    } finally {
      setIsSubmitLocked(false)
    }
  }

  const authPrompt =
    isAuthenticating && authorizationMode !== 'none' ? (
      <WalletFlowAuthPrompt authMode={authorizationMode} isLoading={isSubmitting} onSubmit={accept} />
    ) : null

  const footer = isComplete ? (
    <WalletFlowActionButton onPress={onComplete}>{endButtonLabel}</WalletFlowActionButton>
  ) : authPrompt && surface === 'fullscreen' ? (
    authPrompt
  ) : authPrompt || !submission ? undefined : (
    <YStack gap="$2">
      {submission.areAllSatisfied ? (
        <WalletFlowActionButton
          isLoading={isSubmitting}
          onPress={() => {
            if (isSubmitting) return

            if (authorizationMode === 'none') {
              void accept()
            } else {
              setIsAuthenticating(true)
            }
          }}
        >
          {transactionDataPresentation.acceptLabel}
        </WalletFlowActionButton>
      ) : null}
      <Button.Text scaleOnPress disabled={isSubmitting} onPress={onDecline}>
        {submission.areAllSatisfied
          ? t({
              id: 'common.declineButton',
              message: 'Decline',
              comment: 'Decline button label',
            })
          : t(commonMessages.close)}
      </Button.Text>
    </YStack>
  )

  return (
    <WalletFlowShell
      surface={surface}
      title={isComplete ? t(commonMessages.success) : transactionDataPresentation.title}
      subtitle={isComplete ? verifierName : (verifierName ?? entityId)}
      logo={logo}
      logoFallback={verifierName ?? entityId}
      isLoading={!submission && !errorReason}
      footer={footer}
      onCancel={onCancel}
    >
      {errorReason ? (
        <WalletFlowErrorContent message={errorReason} onClose={onCancel} />
      ) : isComplete ? (
        <Paragraph>
          {t({
            id: 'presentation.onePage.completeDescription',
            message: 'The information was shared successfully.',
            comment: 'Shown after a presentation has been shared',
          })}
        </Paragraph>
      ) : submission ? (
        <YStack gap="$5">
          {overAskingResponse?.validRequest === 'no' ? (
            <YStack p="$3" br="$5" bg="$warning-300">
              <Paragraph>{overAskingResponse.reason}</Paragraph>
            </YStack>
          ) : null}

          {transaction ? <TransactionDataWidget transactionData={transaction} /> : null}

          <SubmissionCredentialSets submission={submission} onSelectionChange={setSelectedCredentials} />

          {surface === 'overlay' ? authPrompt : null}
        </YStack>
      ) : null}
    </WalletFlowShell>
  )
}
