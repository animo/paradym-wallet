import { parseDidCommInvitation, receiveOutOfBandInvitation, useAgent } from '@internal/agent'
import { useToastController } from '@internal/ui'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { DidCommCredentialNotificationScreen } from './DidCommCredentialNotificationScreen'
import { DidCommPresentationNotificationScreen } from './DidCommPresentationNotificationScreen'
import { GettingInformationScreen } from './components/GettingInformationScreen'

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

const { useParams } = createParam<Query>()

export function DidCommNotificationScreen() {
  const { agent } = useAgent()
  const { params } = useParams()
  const toast = useToastController()
  const router = useRouter()

  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false)
  const [notification, setNotification] = useState(
    params.credentialExchangeId
      ? ({ type: 'credentialExchange', id: params.credentialExchangeId } as const)
      : params.proofExchangeId
      ? ({ type: 'proofExchange', id: params.proofExchangeId } as const)
      : undefined
  )

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  useEffect(() => {
    async function handleInvitation() {
      if (isLoadingInvitation) return

      try {
        const invitation = params.invitation
          ? (JSON.parse(decodeURIComponent(params.invitation)) as Record<string, unknown>)
          : params.invitationUrl
          ? decodeURIComponent(params.invitationUrl)
          : undefined

        if (!invitation) return
        setIsLoadingInvitation(true)

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
        pushToWallet()
      }

      setIsLoadingInvitation(false)
    }

    void handleInvitation()
  }, [params.invitation, params.invitationUrl])

  // We were routed here without any notification
  if (
    !params.credentialExchangeId &&
    !params.proofExchangeId &&
    !params.invitation &&
    !params.invitationUrl
  ) {
    // eslint-disable-next-line no-console
    console.error(
      'One of credentialExchangeId, proofExchangeId, invitation or invitationUrl is required when navigating to DidCommNotificationScreen.'
    )
    pushToWallet()
    return null
  }

  if (!notification) {
    return <GettingInformationScreen type="invitation" />
  }

  // NOTE: suspense would be a great fit here as we'd be able to render the component
  // already, but show the <GettingInformationScreen /> while the data inside the
  // component is loading
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
