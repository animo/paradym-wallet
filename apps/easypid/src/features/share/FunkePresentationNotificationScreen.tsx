import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { type FlowSelectedCredentials, SubmissionCredentialSets } from '@easypid/features/flow/SubmissionCredentialSets'
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
import { Button, Heading, Paragraph, YStack } from '@package/ui'
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
  const isSigning = transaction?.type === 'qes_authorization'
  const isSubmitting = isAccepting || isSubmitLocked
  const title = isSigning
    ? t({
        id: 'presentation.onePage.signTitle',
        message: 'Review signature request',
        comment: 'Title for one page signature review',
      })
    : t({
        id: 'presentation.onePage.title',
        message: 'Review data request',
        comment: 'Title for one page presentation review',
      })

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
  ) : authPrompt ? undefined : (
    <YStack gap="$2">
      <WalletFlowActionButton
        disabled={!submission?.areAllSatisfied}
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
        {isSigning
          ? t({
              id: 'presentation.onePage.sign',
              message: 'Sign and share',
              comment: 'Button label to accept a signing request',
            })
          : t({
              id: 'presentation.onePage.share',
              message: 'Share data',
              comment: 'Button label to accept a presentation request',
            })}
      </WalletFlowActionButton>
      <Button.Text scaleOnPress disabled={isSubmitting} onPress={onDecline}>
        {t({
          id: 'common.declineButton',
          message: 'Decline',
          comment: 'Decline button label',
        })}
      </Button.Text>
    </YStack>
  )

  return (
    <WalletFlowShell
      surface={surface}
      title={isComplete ? t(commonMessages.success) : title}
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

          {transaction?.type === 'qes_authorization' ? (
            <YStack p="$3" br="$5" bg="$grey-100" gap="$1">
              <Heading heading="h4">{transaction.documentName}</Heading>
              <Paragraph variant="annotation">{transaction.qtsp.name ?? transaction.qtsp.hostName}</Paragraph>
            </YStack>
          ) : null}

          <SubmissionCredentialSets submission={submission} onSelectionChange={setSelectedCredentials} />

          {surface === 'overlay' ? authPrompt : null}
        </YStack>
      ) : null}
    </WalletFlowShell>
  )
}
