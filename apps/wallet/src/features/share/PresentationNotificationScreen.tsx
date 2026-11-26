import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import {
  getPaymentKind,
  getPaymentSummary,
  isPaymentTransaction,
  type PaymentTransaction,
  type SlideStep,
  SlideWizard,
} from '@package/app'
import { commonMessages } from '@package/translations'
import {
  type DisplayImage,
  type FormattedSubmission,
  type FormattedSubmissionEntrySatisfied,
  type FormattedTransactionData,
  getTransactionStatusMetadata,
  isPasoTransaction,
  type PartyRegistration,
  pasoPaymentTransactionDataType,
  type TrustedEntity,
} from '@paradym/wallet-sdk'
import { InteractionErrorSlide } from '../receive/slides/InteractionErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { PasoConsentSlide } from './slides/PasoConsentSlide'
import { type PasoRefusal, PasoRefusalSlide } from './slides/PasoRefusalSlide'
import { PayAndShareSlide } from './slides/PayAndShareSlide'
import { PaymentSlide } from './slides/PaymentSlide'
import { PinSlide } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'
import { SignAndShareSlide } from './slides/SignAndShareSlide'
import { SigningSlide } from './slides/SigningSlide'

interface PresentationNotificationScreenProps {
  entityId?: string
  verifierName?: string
  logo?: DisplayImage
  trustedEntities?: Array<TrustedEntity>
  isOverAsking?: boolean
  registration?: PartyRegistration
  submission?: FormattedSubmission
  usePin: boolean
  isAccepting: boolean
  transaction?: FormattedTransactionData
  /** Whether `transaction` is being resolved again, e.g. after a different card was picked. */
  isResolvingTransaction?: boolean
  onSelectCredential?: (inputDescriptorId: string, credentialRecordId: string) => void
  onAccept: () => Promise<void>
  onDecline: () => void
  onCancel: () => void
  onComplete: () => void
  errorReason?: string
  /** A PaSO refusal, which gets its own screen instead of the generic error. */
  pasoRefusal?: PasoRefusal
}

export function PresentationNotificationScreen({
  entityId,
  verifierName,
  logo,
  usePin,
  onAccept,
  onCancel,
  onDecline,
  isAccepting,
  submission,
  onComplete,
  trustedEntities,
  isOverAsking,
  registration,
  transaction,
  isResolvingTransaction,
  onSelectCredential,
  errorReason,
  pasoRefusal,
}: PresentationNotificationScreenProps) {
  const { t } = useLingui()
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
            combineWithNext: true,
            scrollsOwnContent: true,
            screen: (
              <VerifyPartySlide
                key="verify-issuer"
                type={
                  transaction?.type === 'qes_authorization'
                    ? 'signing'
                    : isPaymentTransaction(transaction)
                      ? getPaymentKind(transaction)
                      : 'request'
                }
                payee={transaction?.type === pasoPaymentTransactionDataType ? transaction.payee.value : undefined}
                entityId={entityId}
                name={verifierName}
                logo={logo}
                trustedEntities={trustedEntities}
                isBeyondRegistration={isOverAsking}
                registration={registration}
              />
            ),
          },
          ...(submission
            ? transaction?.type === 'qes_authorization'
              ? [
                  {
                    step: 'signing',
                    progress: 50,
                    screen: <SigningSlide qtsp={transaction.qtsp} documentName={transaction.documentName} />,
                  },
                  {
                    step: 'share-credentials',
                    progress: 66,
                    screen: (
                      <SignAndShareSlide
                        key="sign-and-share-credentials"
                        onAccept={usePin ? undefined : onAccept}
                        onDecline={onDecline}
                        isAccepting={isAccepting}
                        qtsp={transaction.qtsp}
                        documentName={transaction.documentName}
                        cardForSigningId={transaction.cardForTransactionId}
                        submission={submission}
                        onSelectCredential={onSelectCredential}
                      />
                    ),
                  },
                ]
              : isPasoTransaction(transaction)
                ? [
                    {
                      step: 'share-credentials',
                      progress: 66,
                      screen: (
                        <PasoConsentSlide
                          key="paso-consent"
                          transaction={transaction}
                          verifierName={verifierName ?? t(commonMessages.unknownOrganization)}
                          submission={submission}
                          onAccept={usePin ? undefined : onAccept}
                          onDecline={onDecline}
                          isAccepting={isAccepting}
                          isResolvingTransaction={isResolvingTransaction}
                          onSelectCredential={onSelectCredential}
                        />
                      ),
                    },
                  ]
                : transaction?.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1'
                  ? [
                      {
                        step: 'payment',
                        progress: 50,
                        screen: (
                          <PaymentSlide
                            transaction={transaction}
                            verifier={{ name: verifierName ?? t(commonMessages.unknownOrganization), logo }}
                            submission={submission}
                          />
                        ),
                      },
                      {
                        step: 'share-credentials',
                        progress: 66,
                        screen: (
                          <PayAndShareSlide
                            key="pay-and-share-slide"
                            onAccept={usePin ? undefined : onAccept}
                            onDecline={onDecline}
                            isAccepting={isAccepting}
                            transaction={transaction}
                            submission={submission}
                            onSelectCredential={onSelectCredential}
                          />
                        ),
                      },
                    ]
                  : [
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
                            onSelectCredential={onSelectCredential}
                          />
                        ),
                      },
                    ]
            : []),
          usePin && {
            step: 'pin-enter',
            scrollsOwnContent: true,
            progress: 82.5,
            screen: (
              <PinSlide
                key="pin-enter"
                isLoading={isAccepting}
                onPinSubmit={onAccept}
                isTransaction={isPaymentTransaction(transaction)}
              />
            ),
          },
          {
            step: 'success',
            progress: 100,
            backIsCancel: true,
            // The second pane lists the shared cards
            ownsWideLayout: !!submission,
            screen: (
              <PresentationSuccessSlide
                showReturnToApp
                verifierName={verifierName}
                onComplete={onComplete}
                submission={submission}
                payment={isPaymentTransaction(transaction) ? paymentSummary(transaction, submission) : undefined}
              />
            ),
          },
        ].filter(Boolean) as SlideStep[]
      }
      errorScreen={() =>
        pasoRefusal ? (
          <PasoRefusalSlide key="paso-refusal" refusal={pasoRefusal} verifierName={verifierName} onClose={onCancel} />
        ) : (
          <InteractionErrorSlide
            key="presentation-error"
            flowType={transaction?.type === 'qes_authorization' ? 'sign' : 'verify'}
            reason={errorReason}
            onCancel={onCancel}
            showReturnToApp
          />
        )
      }
      isError={!!errorReason}
      onCancel={onDecline}
      confirmation={
        isPaymentTransaction(transaction)
          ? {
              title: t(stopPaymentTitles[getPaymentKind(transaction)]),
              description: t({
                id: 'presentation.stopPaymentDescription',
                message: 'If you stop, nothing will be authorised.',
                comment:
                  'Description in the confirmation dialog shown when the user stops a payment, mandate or transaction',
              }),
            }
          : undefined
      }
    />
  )
}

const stopPaymentTitles = {
  payment: defineMessage({
    id: 'presentation.stopPaymentTitle',
    message: 'Stop payment?',
    comment: 'Title of the confirmation dialog shown when the user stops a payment',
  }),
  mandate: defineMessage({
    id: 'presentation.stopMandateTitle',
    message: 'Stop mandate?',
    comment: 'Title of the confirmation dialog shown when the user stops setting up a mandate',
  }),
  transaction: defineMessage({
    id: 'presentation.stopTransactionTitle',
    message: 'Stop transaction?',
    comment:
      'Title of the confirmation dialog shown when the user stops a bank transaction that is not a plain payment',
  }),
}

/** What the success screen says about an authorised payment or PaSO transaction, and the card it was authorised with. */
function paymentSummary(transaction: PaymentTransaction, submission?: FormattedSubmission) {
  const card = submission?.entries.find(
    (entry): entry is FormattedSubmissionEntrySatisfied =>
      entry.inputDescriptorId === transaction.cardForTransactionId && entry.isSatisfied
  )?.credentials[0]?.credential

  return {
    ...getPaymentSummary(transaction),
    kind: getPaymentKind(transaction),
    issuer: card?.display.issuer.name,
    card,
    // Only a TS 12 payment has a status backchannel, and only when its card says where to poll it
    canFollowStatus: !isPasoTransaction(transaction) && !!card && getTransactionStatusMetadata(card.record) !== null,
  }
}
