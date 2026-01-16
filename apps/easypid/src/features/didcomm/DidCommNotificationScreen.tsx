import { useDevelopmentMode } from '@easypid/hooks'
import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { SlideWizard, usePushToWallet } from '@package/app'
import { useDidCommConnectionActions, useParadym } from '@paradym/wallet-sdk/hooks'
import type { ResolveOutOfBandInvitationResult } from '@paradym/wallet-sdk/invitation/resolver'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { InteractionErrorSlide } from '../receive/slides/InteractionErrorSlide'
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
const messages = {
  noInvitation: defineMessage({
    id: 'notification.noInvitation',
    message: 'No invitation was found. Please try again.',
    comment: 'Error shown when a DIDComm invitation is missing in the URL parameters',
  }),
  errorParsingInvitation: defineMessage({
    id: 'notification.errorParsingInvitation',
    message: 'Error parsing invitation',
    comment: 'Generic error message shown when an invitation could not be parsed',
  }),
}

export function DidCommNotificationScreen() {
  const { paradym } = useParadym('unlocked')
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [errorReason, setErrorReason] = useState<string>()
  const [hasHandledNotificationLoading, setHasHandledNotificationLoading] = useState(false)
  const [readyToNavigate, setReadyToNavigate] = useState(false)
  const [resolvedInvitation, setResolvedInvitation] = useState<ResolveOutOfBandInvitationResult | undefined>()
  const [flow, setFlow] = useState<{
    type: 'issue' | 'verify' | 'connect'
    id: string
  }>()
  const { acceptConnection, declineConnection, display } = useDidCommConnectionActions(resolvedInvitation)
  const { t } = useLingui()

  const handleNavigation = () => {
    // When starting from the inbox, we want to go back to the inbox on finish
    if (params.navigationType === 'inbox') {
      router.back()
    } else {
      pushToWallet()
    }
  }

  const onCancel = () => handleNavigation()
  const onComplete = () => handleNavigation()

  const onConnectionAccept = async () => {
    try {
      const result = await acceptConnection()
      setFlow({
        id:
          result.flowType === 'issue'
            ? result.credentialExchangeId
            : result.flowType === 'verify'
              ? result.proofExchangeId
              : result.connectionId,
        type: result.flowType,
      })
    } catch (e) {
      setErrorReason((e as Error).message)
      throw new Error('Error accepting connection')
    }
  }

  // TODO(sdk): we can probably abstract a bit more from this
  useEffect(() => {
    async function handleInvitation() {
      if (hasHandledNotificationLoading) return
      setHasHandledNotificationLoading(true)
      try {
        paradym.logger.debug('Loading DIDComm invitation from params', {
          invitation: params.invitation,
          invitationUrl: params.invitationUrl,
        })
        const invitation = params.invitation
          ? (JSON.parse(decodeURIComponent(params.invitation)) as Record<string, unknown>)
          : params.invitationUrl
            ? decodeURIComponent(params.invitationUrl)
            : undefined
        if (!invitation) {
          setErrorReason(t(messages.noInvitation))
          return
        }

        const resolvedInvite = await paradym.resolveDidCommInvitation(invitation)
        if (resolvedInvite.success) {
          setResolvedInvitation(resolvedInvite)
        } else {
          setErrorReason(resolvedInvite.message)
        }
      } catch (error) {
        if (isDevelopmentModeEnabled && error instanceof Error) {
          setErrorReason(`${t(messages.errorParsingInvitation)}\n\nDevelopment mode error:\n${error.message}`)
        } else {
          setErrorReason(t(messages.errorParsingInvitation))
        }
      }
    }

    if (params.invitation || params.invitationUrl) {
      void handleInvitation()
    }
  }, [
    params.invitation,
    params.invitationUrl,
    hasHandledNotificationLoading,
    isDevelopmentModeEnabled,
    t,
    paradym.resolveDidCommInvitation,
  ])

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
              entityId={resolvedInvitation?.existingConnection?.id}
              onContinue={onConnectionAccept}
              onDecline={declineConnection}
            />
          ),
        },
      ]}
      errorScreen={() => (
        <InteractionErrorSlide
          key="credential-error"
          flowType={
            resolvedInvitation?.flowType === 'issue'
              ? 'issue'
              : resolvedInvitation?.flowType === 'verify'
                ? 'verify'
                : 'connect'
          }
          reason={errorReason}
          onCancel={onCancel}
        />
      )}
      isError={!!errorReason}
      onCancel={onCancel}
      confirmation={getFlowConfirmationText(t, flow?.type)}
    />
  )
}
