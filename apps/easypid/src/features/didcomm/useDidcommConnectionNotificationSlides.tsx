import { type ResolveOutOfBandInvitationResultSuccess, useDidcommConnectionActions } from '@package/agent'
import type { SlideStep } from '@package/app/src'
import { useToastController } from '@package/ui'
import { useActivities } from '../activity/activityRecord'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'

interface DidCommConnectionNotificationSlidesProps {
  resolved: ResolveOutOfBandInvitationResultSuccess
  onCancel: () => void
  onComplete: () => void
}

export function useDidCommConnectionNotificationSlides({
  resolved,
  onComplete,
}: DidCommConnectionNotificationSlidesProps) {
  const toast = useToastController()
  const { acceptConnection, display } = useDidcommConnectionActions(resolved)

  const { activities } = useActivities({ filters: { entityId: resolved.existingConnection?.id } })

  const onConnectionAccept = async () => {
    await acceptConnection().catch(() => {
      toast.show('Something went wrong while connecting.', { customData: { preset: 'danger' } })
    })
    onComplete()
  }

  return resolved.flowType === 'connect'
    ? ([
        {
          step: 'verify-connection',
          progress: 50,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="connect"
              name={display.connection.name}
              logo={display.connection.logo}
              entityId={resolved.existingConnection?.id ?? 'first-interaction'}
              onContinue={onConnectionAccept}
              lastInteractionDate={activities?.[0]?.date}
            />
          ),
        },
      ] as SlideStep[])
    : []
}
