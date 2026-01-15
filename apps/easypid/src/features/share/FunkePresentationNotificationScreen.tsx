import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import type {
  DisplayImage,
  FormattedSubmission,
  FormattedTransactionData,
  QesTransactionDataEntry,
  TrustedEntity,
  TrustMechanism,
  Ts12TransactionDataEntry,
} from '@package/agent'
import { type SlideStep, SlideWizard } from '@package/app'
import { useMemo } from 'react'
import { InteractionErrorSlide } from '../receive/slides/InteractionErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { PinSlide } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'
import { SigningSlide } from './slides/SigningSlide'
import { Ts12PaymentSlide } from './slides/Ts12PaymentSlide'
import { Ts12TransactionSlide } from './slides/Ts12TransactionSlide'

interface FunkePresentationNotificationScreenProps {
  entityId?: string
  verifierName?: string
  logo?: DisplayImage
  overAskingResponse?: OverAskingResponse
  trustedEntities?: Array<TrustedEntity>
  trustMechanism?: TrustMechanism
  submission?: FormattedSubmission
  usePin: boolean
  isAccepting: boolean
  transaction?: FormattedTransactionData
  selectedTransactionData?: {
    credentialId?: string
    additionalPayload?: object
  }[]
  onAccept: () => Promise<void>
  onDecline: () => void
  onCancel: () => void
  onComplete: () => void
  errorReason?: string
  onTransactionDataSelect: (
    index: number,
    data: { credentialId: string; additionalPayload: object | undefined }
  ) => void
  responseMode?: string
}

export function FunkePresentationNotificationScreen({
  entityId,
  verifierName,
  logo,
  usePin,
  onAccept,
  onDecline,
  onCancel,
  onComplete,
  isAccepting,
  submission,
  overAskingResponse,
  trustedEntities,
  trustMechanism,
  transaction,
  selectedTransactionData,
  errorReason,
  onTransactionDataSelect,
  responseMode,
}: FunkePresentationNotificationScreenProps) {
  const transactionData = transaction?.[0]

  const transactionSlides: SlideStep[] = useMemo(
    () =>
      transaction?.flatMap((entry, index) => {
        const progress = 33 + ((index + 1) / (transaction.length + 1)) * 33

        if (entry.type === 'qes_authorization') {
          const qesEntry = entry as QesTransactionDataEntry
          return [
            {
              step: `signing-${index}`,
              progress,
              screen: (
                <SigningSlide
                  key={`signing-${index}`}
                  qtsp={qesEntry.qtsp}
                  documentNames={qesEntry.documentNames}
                  onCredentialSelect={(credentialId) =>
                    onTransactionDataSelect(index, { credentialId, additionalPayload: undefined })
                  }
                  selectedCredentialId={selectedTransactionData?.[index]?.credentialId}
                  possibleCredentialIds={qesEntry.formattedSubmissions.flatMap((s) =>
                    s.isSatisfied ? s.credentials.map((c) => c.credential.id) : []
                  )}
                />
              ),
            },
          ]
        }

        const ts12Entry = entry as Ts12TransactionDataEntry

        if (ts12Entry.type === 'urn:eudi:sca:payment:1') {
          return [
            {
              step: `ts12-payment-${index}`,
              progress,
              screen: (
                <Ts12PaymentSlide
                  key={`ts12-payment-${index}`}
                  entry={ts12Entry}
                  onCredentialSelect={(credentialId, additionalPayload) =>
                    onTransactionDataSelect(index, { credentialId, additionalPayload })
                  }
                  selectedCredentialId={selectedTransactionData?.[index]?.credentialId}
                  responseMode={responseMode}
                />
              ),
            },
          ]
        }

        return [
          {
            step: `ts12-${index}`,
            progress,
            screen: (
              <Ts12TransactionSlide
                key={`ts12-${index}`}
                entry={ts12Entry}
                onCredentialSelect={(credentialId, additionalPayload) =>
                  onTransactionDataSelect(index, { credentialId, additionalPayload })
                }
                selectedCredentialId={selectedTransactionData?.[index]?.credentialId}
                responseMode={responseMode}
              />
            ),
          },
        ]
      }) ?? [],
    [transaction, onTransactionDataSelect, responseMode, selectedTransactionData]
  )

  return (
    <SlideWizard
      steps={
        [
          {
            step: 'loading-request',
            progress: 16.5,
            screen: <LoadingRequestSlide key="loading-request" isLoading={!submission} isError={false} />,
          },
          {
            step: 'verify-issuer',
            progress: 33,
            backIsCancel: true,
            screen: (
              <VerifyPartySlide
                key="verify-issuer"
                type={transactionData?.type === 'qes_authorization' ? 'signing' : 'request'}
                entityId={entityId}
                name={verifierName}
                logo={logo}
                trustedEntities={trustedEntities}
                trustMechanism={trustMechanism}
              />
            ),
          },
          ...(submission
            ? [
                ...transactionSlides,
                {
                  step: 'share-credentials',
                  progress: 66,
                  screen: (
                    <ShareCredentialsSlide
                      key="share-credentials"
                      onAccept={usePin ? undefined : onAccept}
                      logo={logo}
                      submission={submission}
                      onDecline={onDecline}
                      isAccepting={isAccepting}
                      overAskingResponse={overAskingResponse}
                      formattedTransactionData={transaction}
                      selectedTransactionData={selectedTransactionData}
                    />
                  ),
                },
              ]
            : []),
          usePin && {
            step: 'pin-enter',
            progress: 82.5,
            screen: <PinSlide key="pin-enter" isLoading={isAccepting} onPinSubmit={onAccept} />,
          },
          {
            step: 'success',
            progress: 100,
            backIsCancel: true,
            screen: <PresentationSuccessSlide showReturnToApp verifierName={verifierName} onComplete={onComplete} />,
          },
        ].filter(Boolean) as SlideStep[]
      }
      errorScreen={() => (
        <InteractionErrorSlide
          key="presentation-error"
          flowType={transactionData?.type === 'qes_authorization' ? 'sign' : 'verify'}
          reason={errorReason}
          onCancel={onCancel}
        />
      )}
      isError={!!errorReason}
      onCancel={onDecline}
    />
  )
}
