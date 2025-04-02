import {
  type ResolveOutOfBandInvitationResultSuccess,
  parseDidCommInvitation,
  resolveOutOfBandInvitation,
  useDidCommConnectionActions,
} from '@package/agent'
import { type SlideStep, SlideWizard, usePushToWallet } from '@package/app/src'

import { useEffect, useState } from 'react'
import { createParam } from 'solito'

import { useParadymAgent } from '@easypid/agent'
import { useDevelopmentMode } from '@easypid/hooks'
import { router } from 'expo-router'
import { useActivities } from '../activity/activityRecord'
import { CredentialErrorSlide } from '../receive/slides/CredentialErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { useDidCommConnectionNotificationSlides } from './useDidCommConnectionNotificationSlides'
import { useDidCommCredentialNotificationSlides } from './useDidCommCredentialNotificationSlides'
import { useDidCommPresentationNotificationSlides } from './useDidCommPresentationNotificationSlides'

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
  const [resolved, setResolved] = useState<ResolveOutOfBandInvitationResultSuccess | undefined>()

  // TODO: Fetch connection record from the related proof/credential exchange
  const [notification, setNotification] = useState<
    | {
        id: string
        type: 'issue' | 'verify' | 'connect'
      }
    | undefined
  >(
    params.credentialExchangeId
      ? { id: params.credentialExchangeId, type: 'issue' }
      : params.proofExchangeId
        ? { id: params.proofExchangeId, type: 'verify' }
        : undefined
  )

  const handleNavigation = (type: 'replace' | 'back') => {
    // When starting from the inbox, we want to go back to the inbox on finish
    if (params.navigationType === 'inbox') {
      router.back()
    } else {
      pushToWallet(type)
    }
  }

  const onCancel = () => {
    if (notification?.type === 'issue') {
      void agent.modules.credentials.deleteById(notification.id)
    } else if (notification?.type === 'verify') {
      void agent.modules.proofs.deleteById(notification.id)
    }

    handleNavigation('back')
  }

  const onComplete = () => handleNavigation('replace')

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

        setResolved(resolveResult)
        setNotification({
          id: resolveResult.outOfBandInvitation.id,
          type: resolveResult.flowType,
        })
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

  // All flows have the same entry point, so we re-use the same loading request slide
  // This way we avoid a double loading screen when the respective flow is entered
  // Call hooks unconditionally at the top level
  const credentialSlides = useDidCommCredentialNotificationSlides({
    credentialExchangeId: notification?.id ?? '',
    onCancel,
    onComplete,
  })

  const presentationSlides = useDidCommPresentationNotificationSlides({
    proofExchangeId: notification?.id ?? '',
    onCancel,
    onComplete,
  })

  const connectionSlides = useDidCommConnectionNotificationSlides({
    name: resolved?.existingConnection?.alias ?? resolved?.existingConnection?.theirLabel ?? 'Unknown',
    onCancel,
    onComplete,
  })

  const { activities } = useActivities({ filters: { entityId: resolved?.existingConnection?.id } })
  const { acceptConnection, declineConnection, display } = useDidCommConnectionActions(
    resolved ??
      // FIXME: Placeholder is needed because it's rendered before resolved object is available
      ({
        outOfBandInvitation: { id: 'placeholder', label: 'placeholder', imageUrl: 'https://example.com/logo.png' },
      } as ResolveOutOfBandInvitationResultSuccess)
  )

  // handle accept
  const onConnectionAccept = async () => {
    const result = await acceptConnection()
    if (result.success) {
      setNotification({
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

  const steps: SlideStep[] = [
    {
      step: 'loading-request',
      progress: 33,
      screen: (
        <LoadingRequestSlide key="loading-request" isLoading={!notification && !resolved} isError={!!errorReason} />
      ),
    },
    {
      step: 'verify-issuer',
      progress: 50,
      screen: (
        <VerifyPartySlide
          key="verify-issuer"
          type="connect"
          name={display.connection.name}
          logo={display.connection.logo}
          entityId={resolved?.existingConnection?.id ?? ''}
          lastInteractionDate={activities?.[0]?.date}
          onContinue={async () => {
            await onConnectionAccept()
          }}
          onDecline={declineConnection}
        />
      ),
    },
    ...(notification
      ? notification.type === 'issue'
        ? credentialSlides
        : notification.type === 'verify'
          ? presentationSlides
          : notification.type === 'connect'
            ? connectionSlides
            : []
      : []),
  ].filter(Boolean) as SlideStep[]

  return (
    <SlideWizard
      steps={steps}
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={!!errorReason}
      onCancel={onCancel}
      confirmation={getConfirmationText(notification?.type)}
    />
  )
}

const getConfirmationText = (type?: 'issue' | 'verify' | 'connect') => {
  if (!type) return undefined

  if (type === 'issue') {
    return {
      title: 'Decline card?',
      description: 'If you decline, you will not receive the card.',
      confirmText: 'Yes, decline',
    }
  }
  if (type === 'verify') {
    return {
      title: 'Stop sharing?',
      description: 'If you stop, no data will be shared.',
      confirmText: 'Yes, stop',
    }
  }
  return {
    title: 'Stop interaction?',
    description: 'If you stop, nothing will be saved.',
    confirmText: 'Yes, stop',
  }
}
