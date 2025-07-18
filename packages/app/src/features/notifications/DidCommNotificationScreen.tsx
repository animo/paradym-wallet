import { useToastController } from '@package/ui'
import { useParadymWalletSdk } from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { usePushToWallet } from '../../hooks'
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

export function DidCommNotificationScreen() {
  const pws = useParadymWalletSdk()
  const { logger } = pws.hooks.useLogger()
  const params = useLocalSearchParams<Query>()
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
      if (hasHandledNotificationLoading) return
      setHasHandledNotificationLoading(true)

      try {
        const invitation = params.invitation
          ? (JSON.parse(decodeURIComponent(params.invitation)) as Record<string, unknown>)
          : params.invitationUrl
            ? decodeURIComponent(params.invitationUrl)
            : undefined

        // Might be no invitation if a presentationExchangeId or credentialExchangeId is passed directly
        if (!invitation) return

        const receiveResult = await pws.resolveDidCommInvitation(invitation)
        if (!receiveResult.success) {
          toast.show(receiveResult.message)
          pushToWallet()
          return
        }
      } catch (error: unknown) {
        logger.error('Error parsing invitation', {
          error,
        })
        toast.show('Error parsing invitation')
        pushToWallet()
      }
    }

    void handleInvitation()
  }, [
    params.invitation,
    params.invitationUrl,
    hasHandledNotificationLoading,
    toast,
    pushToWallet,
    logger.error,
    pws.resolveDidCommInvitation,
  ])

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
  logger.error('Unknown notification type on DidCommNotificationScreen', notification)
  pushToWallet()
  return null
}
