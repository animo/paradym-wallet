import { useParadymAgent } from '@easypid/agent'
import { useDevelopmentMode } from '@easypid/hooks'
import {
  type ResolveOutOfBandInvitationResultSuccess,
  parseDidCommInvitation,
  resolveOutOfBandInvitation,
  useDidCommConnectionActions,
} from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app/src'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { createParam } from 'solito'
import { useActivities } from '../activity/activityRecord'
import { CredentialErrorSlide } from '../receive/slides/CredentialErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { ConnectionSlides } from './ConnectionSlides'
import { CredentialSlides } from './CredentialSlides'
import { PresentationSlides } from './PresentationSlides'
import { getFlowConfirmationText } from './utils'

type Query = {
  invitation?: string
  invitationUrl?: string
  credentialExchangeId?: string
  proofExchangeId?: string
  navigationType?: 'inbox'
}

const { useParams } = createParam<Query>()

export function DidCommNotificationScreen() {
  const { agent } = useParadymAgent()
  const { params } = useParams()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [errorReason, setErrorReason] = useState<string>()
  const [hasHandledNotificationLoading, setHasHandledNotificationLoading] = useState(false)
  const [readyToNavigate, setReadyToNavigate] = useState(false)
  const [resolvedInvitation, setResolvedInvitation] = useState<ResolveOutOfBandInvitationResultSuccess | undefined>()
  const [flow, setFlow] = useState<{
    type: 'issue' | 'verify' | 'connect'
    id: string
  }>()

  const { activities } = useActivities({ filters: { entityId: resolvedInvitation?.existingConnection?.id } })
  const { acceptConnection, declineConnection, display } = useDidCommConnectionActions(resolvedInvitation)

  const handleNavigation = (type: 'replace' | 'back') => {
    // When starting from the inbox, we want to go back to the inbox on finish
    if (params.navigationType === 'inbox') {
      router.back()
    } else {
      pushToWallet(type)
    }
  }

  const onCancel = () => handleNavigation('back')
  const onComplete = () => handleNavigation('replace')

  const onConnectionAccept = async () => {
    const result = await acceptConnection()

    if (result.success) {
      setFlow({
        id:
          result.flowType === 'issue'
            ? result.credentialExchangeId
            : result.flowType === 'verify'
              ? result.proofExchangeId
              : result.connectionId,
        type: result.flowType,
      })
    }
  }

  useEffect(() => {
    async function handleInvitation() {
      if (hasHandledNotificationLoading) return
      setHasHandledNotificationLoading(true)
      try {
        const invitation = params.invitation
          ? (JSON.parse(decodeURIComponent(params.invitation)) as Record<string, unknown>)
          : params.invitationUrl
            ? decodeURIComponent(params.invitationUrl)
            : undefined
        if (!invitation) {
          setErrorReason('No invitation was found. Please try again.')
          return
        }

        const parseResult = await parseDidCommInvitation(agent, invitation)
        if (!parseResult.success) {
          setErrorReason(parseResult.error)
          return
        }

        const resolveResult = await resolveOutOfBandInvitation(agent, parseResult.result)
        if (!resolveResult.success) {
          setErrorReason(resolveResult.error)
          return
        }

        setResolvedInvitation(resolveResult)
      } catch (error: unknown) {
        agent.config.logger.error('Error parsing invitation', {
          error,
        })
        if (isDevelopmentModeEnabled && error instanceof Error) {
          setErrorReason(`Error parsing invitation\n\nDevelopment mode error:\n${error.message}`)
        } else {
          setErrorReason('Error parsing invitation')
        }
      }
    }

    if (params.invitation || params.invitationUrl) {
      void handleInvitation()
    }
  }, [params.invitation, params.invitationUrl, hasHandledNotificationLoading, agent, isDevelopmentModeEnabled])

  // Delay the navigation to hide the fact we're loading in the new slides based on the flow type
  useEffect(() => {
    if (flow) {
      setTimeout(() => {
        setReadyToNavigate(true)
      }, 250)
    }
  }, [flow])

  if (flow?.type === 'connect' && readyToNavigate) {
    return <ConnectionSlides name={display.connection.name} onCancel={onCancel} onComplete={onComplete} />
  }

  if ((flow?.type === 'issue' && readyToNavigate) || params.credentialExchangeId) {
    const isExistingExchange = !!params.credentialExchangeId
    const id = isExistingExchange ? params.credentialExchangeId : flow?.id

    return (
      <CredentialSlides
        isExisting={isExistingExchange}
        credentialExchangeId={id as string}
        onCancel={onCancel}
        onComplete={onComplete}
      />
    )
  }
  if ((flow?.type === 'verify' && readyToNavigate) || params.proofExchangeId) {
    const isExistingExchange = !!params.proofExchangeId
    const id = isExistingExchange ? params.proofExchangeId : flow?.id

    return (
      <PresentationSlides
        isExisting={isExistingExchange}
        proofExchangeId={id as string}
        onCancel={onCancel}
        onComplete={onComplete}
      />
    )
  }

  return (
    <SlideWizard
      willResume
      steps={[
        {
          step: 'loading-request',
          progress: 33,
          screen: <LoadingRequestSlide key="loading-request" isLoading={!resolvedInvitation} isError={!!errorReason} />,
        },
        {
          step: 'verify-issuer',
          progress: resolvedInvitation?.flowType === 'connect' ? 66 : 50,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type={
                resolvedInvitation?.flowType === 'issue'
                  ? 'offer'
                  : resolvedInvitation?.flowType === 'verify'
                    ? 'request'
                    : 'connect'
              }
              name={display.connection.name}
              logo={display.connection.logo}
              entityId={resolvedInvitation?.existingConnection?.id ?? ''}
              lastInteractionDate={activities?.[0]?.date}
              onContinue={onConnectionAccept}
              onDecline={declineConnection}
            />
          ),
        },
      ]}
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={!!errorReason}
      onCancel={onCancel}
      confirmation={getFlowConfirmationText(flow?.type)}
    />
  )
}
