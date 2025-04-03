import {
  type ResolveOutOfBandInvitationResultSuccess,
  parseDidCommInvitation,
  resolveOutOfBandInvitation,
} from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app/src'

import { useEffect, useState } from 'react'
import { createParam } from 'solito'

import { useParadymAgent } from '@easypid/agent'
import { useDevelopmentMode } from '@easypid/hooks'
import { router } from 'expo-router'
import { CredentialErrorSlide } from '../receive/slides/CredentialErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'

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

  const [resolved, setResolved] = useState<ResolveOutOfBandInvitationResultSuccess>()
  const [errorReason, setErrorReason] = useState<string>()
  const [hasHandledNotificationLoading, setHasHandledNotificationLoading] = useState(false)

  const handleNavigation = (type: 'replace' | 'back') => {
    // When starting from the inbox, we want to go back to the inbox on finish
    if (params.navigationType === 'inbox') {
      router.back()
    } else {
      pushToWallet(type)
    }
  }

  const onCancel = () => {
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

  useEffect(() => {
    async function handleExchangeParams() {
      if (hasHandledNotificationLoading) return
      setHasHandledNotificationLoading(true)
      try {
        // TODO: we need to find the out of band record associated with the credential exchange ...
        if (params.credentialExchangeId) {
        }
        if (params.proofExchangeId) {
        }

        setResolved(resolveResult)
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

    if (params.credentialExchangeId || params.proofExchangeId) {
      void handleExchangeParams()
    }
  }, [
    params.credentialExchangeId,
    params.proofExchangeId,
    hasHandledNotificationLoading,
    agent,
    isDevelopmentModeEnabled,
  ])

  return (
    <SlideWizard
      key="didcomm-slides"
      // Both flows have the same entry point, so we re-use the same loading request slide
      // This way we avoid a double loading screen when the respective flow is entered
      steps={[
        {
          step: 'loading-request',
          progress: 33,
          screen: <LoadingRequestSlide key="loading-request" isLoading={true} isError={!!errorReason} />,
        },
      ]}
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={!!errorReason}
      onCancel={onCancel}
      // confirmation={{
      //   title: notification?.type === 'credentialExchange' ? 'Decline card?' : 'Stop sharing?',
      //   description:
      //     notification?.type === 'credentialExchange'
      //       ? 'If you decline, you will not receive the card.'
      //       : 'If you stop, no data will be shared.',
      //   confirmText: notification?.type === 'credentialExchange' ? 'Yes, decline' : 'Yes, stop',
      // }}
    />
  )
}
