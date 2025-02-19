import { parseDidCommInvitation, receiveOutOfBandInvitation } from '@package/agent'
import { type SlideStep, SlideWizard, usePushToWallet } from '@package/app/src'

import { useEffect, useState } from 'react'
import { createParam } from 'solito'

import { useParadymAgent } from '@easypid/agent'
import { useDevelopmentMode } from '@easypid/hooks'
import { CredentialErrorSlide } from '../receive/slides/CredentialErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { useDidCommCredentialNotificationSlides } from './useDidCommCredentialNotificationSlides'
import { useDidCommPresentationNotificationSlides } from './useDidCommPresentationNotificationSlides'

type Query = {
  invitation?: string
  invitationUrl?: string
}

const { useParams } = createParam<Query>()

export function DidCommNotificationScreen() {
  const { agent } = useParadymAgent()
  const { params } = useParams()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [errorReason, setErrorReason] = useState<string>()
  const [hasHandledNotificationLoading, setHasHandledNotificationLoading] = useState(false)
  const [notification, setNotification] = useState<{
    id: string
    type: 'credentialExchange' | 'proofExchange'
  }>()

  const onCancel = () => pushToWallet('back')
  const onComplete = () => pushToWallet('replace')

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

        const receiveResult = await receiveOutOfBandInvitation(agent, parseResult.result)
        if (!receiveResult.success) {
          setErrorReason(receiveResult.error)
          return
        }

        setNotification({
          id: receiveResult.id,
          type: receiveResult.type,
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

    void handleInvitation()
  }, [params.invitation, params.invitationUrl, hasHandledNotificationLoading, agent, isDevelopmentModeEnabled])

  // We were routed here without an invitation
  if (!params.invitation && !params.invitationUrl) {
    // eslint-disable-next-line no-console
    console.error('One of invitation or invitationUrl is required when navigating to DidCommNotificationScreen.')
    pushToWallet()
    return null
  }

  // Both flows have the same entry point, so we re-use the same loading request slide
  // This way we avoid a double loading screen when the respective flow is entered
  const steps: SlideStep[] = [
    {
      step: 'loading-request',
      progress: 33,
      screen: <LoadingRequestSlide key="loading-request" isLoading={!notification} isError={!!errorReason} />,
    },
  ]

  const credentialSlides = useDidCommCredentialNotificationSlides({
    credentialExchangeId: notification?.id as string,
    onCancel,
    onComplete,
  })
  const presentationSlides = useDidCommPresentationNotificationSlides({
    proofExchangeId: notification?.id as string,
    onCancel,
    onComplete,
  })

  // Add the appropriate slides based on notification type
  if (notification) {
    if (notification.type === 'credentialExchange') {
      steps.push(...credentialSlides)
    } else if (notification.type === 'proofExchange') {
      steps.push(...presentationSlides)
    }
  }

  return (
    <SlideWizard
      steps={steps}
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={!!errorReason}
      onCancel={onCancel}
    />
  )
}
