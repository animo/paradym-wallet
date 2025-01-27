import { parseDidCommInvitation, receiveOutOfBandInvitation } from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app/src'

import { useToastController } from '@package/ui'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'

import { useAppAgent } from '@easypid/agent'
import { isParadymAgent } from '@package/agent/src/agent'
import { DidCommCredentialNotificationScreen } from '../receive/DidcommCredentialNotificationScreen'
import { CredentialErrorSlide } from '../receive/slides/CredentialErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { DidCommPresentationNotificationScreen } from '../share/DidCommPresentationNotificationScreen'
import { PresentationSuccessSlide } from '../share/slides/PresentationSuccessSlide'

type Query = {
  invitation?: string
  invitationUrl?: string
}

const { useParams } = createParam<Query>()

export function DidCommNotificationScreen() {
  const { agent } = useAppAgent()
  const { params } = useParams()
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const onCancel = () => pushToWallet('back')
  const onComplete = () => pushToWallet('replace')

  const [hasHandledNotificationLoading, setHasHandledNotificationLoading] = useState(false)
  const [notification, setNotification] = useState<{
    id: string
    type: 'credentialExchange' | 'proofExchange'
  }>()

  const [errorReason, setErrorReason] = useState<string>()

  useEffect(() => {
    async function handleInvitation() {
      if (hasHandledNotificationLoading) return
      if (!isParadymAgent(agent)) return
      setHasHandledNotificationLoading(true)
      try {
        const invitation = params.invitation
          ? (JSON.parse(decodeURIComponent(params.invitation)) as Record<string, unknown>)
          : params.invitationUrl
            ? decodeURIComponent(params.invitationUrl)
            : undefined
        // Might be no invitation if a presentationExchangeId or credentialExchangeId is passed directly
        if (!invitation) return

        const parseResult = await parseDidCommInvitation(agent, invitation)
        if (!parseResult.success) {
          toast.show(parseResult.error)
          pushToWallet()
          return
        }

        const receiveResult = await receiveOutOfBandInvitation(agent, parseResult.result)
        if (!receiveResult.success) {
          toast.show(receiveResult.error)
          pushToWallet()
          return
        }

        // We now know the type of the invitation
        setNotification({
          id: receiveResult.id,
          type: receiveResult.type,
        })
      } catch (error: unknown) {
        agent.config.logger.error('Error parsing invitation', {
          error,
        })
        toast.show('Error parsing invitation')
        setErrorReason('Error parsing invitation')
      }
    }

    void handleInvitation()
  }, [params.invitation, params.invitationUrl, hasHandledNotificationLoading, agent, toast, pushToWallet])

  // We were routed here without any notification
  if (!params.invitation && !params.invitationUrl) {
    // eslint-disable-next-line no-console
    console.error('One of invitation or invitationUrl is required when navigating to DidCommNotificationScreen.')
    pushToWallet()
    return null
  }

  // TODO: Ideally we can combine the slides with this that are returned in the credential/proof flows
  // This way, we can use multiple slides in the flows.
  // Because this doesn't really scale well (e.g. what if we want trust screens in the flows?)
  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 33,
          screen: <LoadingRequestSlide key="loading-request" isLoading={!notification} isError={!!errorReason} />,
        },
        ...(notification?.type === 'credentialExchange'
          ? [
              {
                step: 'retrieve-credential',
                progress: 66,
                backIsCancel: true,
                screen: <DidCommCredentialNotificationScreen credentialExchangeId={notification.id} />,
              },
            ]
          : notification?.type === 'proofExchange'
            ? [
                {
                  step: 'retrieve-presentation',
                  progress: 66,
                  backIsCancel: true,
                  screen: <DidCommPresentationNotificationScreen proofExchangeId={notification.id} />,
                },
                {
                  step: 'success',
                  progress: 100,
                  backIsCancel: true,
                  screen: <PresentationSuccessSlide onComplete={onComplete} />,
                },
              ]
            : []),
      ]}
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={!!errorReason}
      onCancel={onCancel}
    />
  )
}
