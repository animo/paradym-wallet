import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAgent } from '../agent'
import { type ResolveOutOfBandInvitationResultSuccess, acceptOutOfBandInvitation } from '../invitation'

export function useDidCommConnectionActions(resolved?: ResolveOutOfBandInvitationResultSuccess) {
  const { agent } = useAgent()

  const { mutateAsync: acceptConnectionMutation, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommConnection', resolved?.outOfBandInvitation.id],
    mutationFn: async () => {
      if (!resolved) throw new Error("Missing 'resolved' parameter")

      const result = await acceptOutOfBandInvitation(agent, resolved.outOfBandInvitation, resolved.flowType)
      if (!result.success) {
        throw new Error('Error creating connection')
      }

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
          ? resolved.existingConnection?.alias ?? resolved.existingConnection?.theirLabel ?? 'Unknown'
          : resolved?.outOfBandInvitation.label ?? 'Unknown',
        logo: {
          url: resolved?.existingConnection
            ? resolved?.existingConnection.imageUrl
            : resolved?.outOfBandInvitation.imageUrl,
        },
      },
    },
  }
}
