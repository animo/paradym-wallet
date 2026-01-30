import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { acceptOutOfBandInvitation, type ResolveOutOfBandInvitationResult } from '../invitation/resolver'
import { useParadym } from './useParadym'

export function useDidCommConnectionActions(resolved?: ResolveOutOfBandInvitationResult) {
  const { paradym } = useParadym('unlocked', 'didcomm')

  const { mutateAsync: acceptConnectionMutation, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommConnection', resolved?.outOfBandInvitation.id],
    mutationFn: async () => {
      if (!resolved) throw new Error("Missing 'resolved' parameter")

      const result = await acceptOutOfBandInvitation(paradym.agent, resolved.outOfBandInvitation, resolved.flowType)
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
          ? (resolved.existingConnection?.alias ?? resolved.existingConnection?.theirLabel)
          : resolved?.outOfBandInvitation.label,
        logo: {
          url: resolved?.existingConnection
            ? resolved?.existingConnection.imageUrl
            : resolved?.outOfBandInvitation.imageUrl,
        },
      },
    },
  }
}
