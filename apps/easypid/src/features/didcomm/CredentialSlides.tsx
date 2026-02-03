import { useLingui } from '@lingui/react/macro'
import { SlideWizard } from '@package/app/components/SlideWizard'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { storeReceivedActivity, useDidCommCredentialActions, useParadym } from '@paradym/wallet-sdk'
import { assertAgentType } from '@paradym/wallet-sdk/agent'
import { useCallback, useState } from 'react'
import { useDevelopmentMode } from '../../hooks'
import { CredentialRetrievalSlide } from '../receive/slides/CredentialRetrievalSlide'
import { InteractionErrorSlide } from '../receive/slides/InteractionErrorSlide'
import { getFlowConfirmationText } from './utils'

type CredentialSlidesProps = {
  isExisting: boolean
  credentialExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function CredentialSlides({ isExisting, credentialExchangeId, onCancel, onComplete }: CredentialSlidesProps) {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const [errorReason, setErrorReason] = useState<string>()
  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)

  const { t } = useLingui()

  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const setErrorReasonWithError = useCallback(
    (baseMessage: string, error: unknown) => {
      if (isDevelopmentModeEnabled && error instanceof Error) {
        setErrorReason(`${baseMessage}\n\nDevelopment mode error:\n${error.message}`)
      } else {
        setErrorReason(baseMessage)
      }
    },
    [isDevelopmentModeEnabled]
  )

  const onCredentialAccept = async () => {
    const agent = paradym.agent
    assertAgentType(agent, 'didcomm')

    try {
      const w3cRecord = await acceptCredential()
      if (w3cRecord) {
        // TODO(sdk): add to acceptCredential method in SDK
        await storeReceivedActivity(paradym, {
          entityId: credentialExchange?.connectionId,
          name: display.issuer.name ?? t(commonMessages.unknown),
          logo: display.issuer.logo,
          backgroundColor: '#ffffff', // Default to a white background for now
          deferredCredentials: [],
          credentialIds: [`w3c-credential-${w3cRecord?.id}`],
        })
      }
    } catch (error) {
      paradym.logger.error('Error accepting credential over DIDComm', {
        error,
      })

      if (credentialExchange) await agent.didcomm.credentials.deleteById(credentialExchange.id)
      setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
    }
  }

  const onCredentialDecline = () => {
    const agent = paradym.agent
    assertAgentType(agent, 'didcomm')

    if (credentialExchange) {
      declineCredential().finally(() => {
        void agent.didcomm.credentials.deleteById(credentialExchange.id)
      })
    }

    toast.show(
      t({
        id: 'credential.declined',
        message: 'Credential has been declined.',
        comment: 'Shown in a toast when user declines the credential',
      })
    )
    onCancel()
  }

  return (
    <SlideWizard
      resumeFrom={isExisting ? undefined : 50}
      steps={[
        {
          step: 'retrieve-credential',
          progress: isExisting ? 50 : 75,
          backIsCancel: true,
          screen: (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onComplete}
              display={display}
              attributes={attributes ?? {}}
              isCompleted={acceptStatus === 'success'}
              onAccept={onCredentialAccept}
              // If state is not idle, it means we have pressed accept
              isAccepting={acceptStatus !== 'idle'}
            />
          ),
        },
      ]}
      onCancel={onCredentialDecline}
      errorScreen={() => (
        <InteractionErrorSlide key="credential-error" flowType={'issue'} reason={errorReason} onCancel={onCancel} />
      )}
      isError={errorReason !== undefined}
      confirmation={getFlowConfirmationText(t, 'issue')}
    />
  )
}
