import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAgent } from '../agent'
import { acceptOutOfBandInvitation, type ResolveOutOfBandInvitationResultSuccess } from '../invitation'

export function useDidCommConnectionActions(resolved?: ResolveOutOfBandInvitationResultSuccess) {
  const { agent } = useAgent()
  const { t } = useLingui()
  const { mutateAsync: acceptConnectionMutation, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommConnection', resolved?.outOfBandInvitation.id],
    mutationFn: async () => {
      if (!resolved) throw new Error("Missing 'resolved' parameter")

      const result = await acceptOutOfBandInvitation(agent, resolved.outOfBandInvitation, resolved.flowType)
      return result
    },
  })

  const declineConnection = useCallback(() => {
    // no-op
  }, [])

  return {
    acceptConnection: acceptConnectionMutation,
    declineConnection,
    acceptStatus,
    display: {
      connection: {
        name: resolved?.existingConnection
          ? (resolved.existingConnection?.alias ?? resolved.existingConnection?.theirLabel ?? t(commonMessages.unknown))
          : (resolved?.outOfBandInvitation.label ?? t(commonMessages.unknown)),
        logo: {
          url: resolved?.existingConnection
            ? resolved?.existingConnection.imageUrl
            : resolved?.outOfBandInvitation.imageUrl,
        },
      },
    },
  }
}
