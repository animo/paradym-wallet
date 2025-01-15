import { parseDidCommInvitation, receiveOutOfBandInvitation, useAgent } from '@package/agent'
import {
  DidCommCredentialNotificationScreen,
  DidCommPresentationNotificationScreen,
  usePushToWallet,
} from '@package/app/src'
import { Spinner, YStack, useToastController } from '@package/ui'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'

// We can route to this page from an existing record
// but also from a new invitation. So we support quite some
// params and we differ flow based on the params provided
// but this means we can have a single entrypoint and don't have to
// first route to a generic invitation page sometimes and then route
// to a credential or presentation screen when we have more information
type Query = {
  invitation?: string
  invitationUrl?: string
  proofExchangeId?: string
  credentialExchangeId?: string
}

// For DIDComm we have first the invitation step
// And then the credential or presentation step

// TODO:
// Keep the invitation step here as an entrypoint for the didcomm flow
// Then try to reuse the credential or presentation screens already implemented for OpenID

const { useParams } = createParam<Query>()

export function DidCommNotificationScreen() {
  const { agent } = useAgent()
  const { params } = useParams()
  const toast = useToastController()
  const pushToWallet = usePushToWallet()

  const [hasHandledNotificationLoading, setHasHandledNotificationLoading] = useState(false)
  const [notification, setNotification] = useState(
    params.credentialExchangeId
      ? ({
          type: 'credentialExchange',
          id: params.credentialExchangeId,
        } as const)
      : params.proofExchangeId
        ? ({ type: 'proofExchange', id: params.proofExchangeId } as const)
        : undefined
  )

  useEffect(() => {
    async function handleInvitation() {
      console.log('1')
      if (hasHandledNotificationLoading) return
      setHasHandledNotificationLoading(true)
      console.log('2')
      try {
        console.log('3')
        const invitation = params.invitation
          ? (JSON.parse(decodeURIComponent(params.invitation)) as Record<string, unknown>)
          : params.invitationUrl
            ? decodeURIComponent(params.invitationUrl)
            : undefined
        console.log('4')
        // Might be no invitation if a presentationExchangeId or credentialExchangeId is passed directly
        if (!invitation) return

        console.log('5')
        const parseResult = await parseDidCommInvitation(agent, invitation)
        console.log('6')
        if (!parseResult.success) {
          toast.show(parseResult.error)
          pushToWallet()
          return
        }

        console.log('7')
        const receiveResult = await receiveOutOfBandInvitation(agent, parseResult.result)
        console.log('8')
        if (!receiveResult.success) {
          toast.show(receiveResult.error)
          pushToWallet()
          return
        }

        // We now know the type of the invitation
        console.log('9')
        setNotification({
          id: receiveResult.id,
          type: receiveResult.type,
        })
      } catch (error: unknown) {
        console.log('10')
        agent.config.logger.error('Error parsing invitation', {
          error,
        })
        toast.show('Error parsing invitation')
        pushToWallet()
      }
    }

    void handleInvitation()
  }, [params.invitation, params.invitationUrl, hasHandledNotificationLoading, agent, toast, pushToWallet])

  // We were routed here without any notification
  if (!params.credentialExchangeId && !params.proofExchangeId && !params.invitation && !params.invitationUrl) {
    // eslint-disable-next-line no-console
    console.error(
      'One of credentialExchangeId, proofExchangeId, invitation or invitationUrl is required when navigating to DidCommNotificationScreen.'
    )
    pushToWallet()
    return null
  }

  if (!notification) {
    return (
      <YStack justifyContent="center" alignItems="center">
        <Spinner />
      </YStack>
    )
  }

  if (notification.type === 'credentialExchange') {
    return <DidCommCredentialNotificationScreen credentialExchangeId={notification.id} />
  }

  if (notification.type === 'proofExchange') {
    return <DidCommPresentationNotificationScreen proofExchangeId={notification.id} />
  }

  // eslint-disable-next-line no-console
  console.error('Unknown notification type on DidCommNotificationScreen', notification)
  pushToWallet()
  return null
}
