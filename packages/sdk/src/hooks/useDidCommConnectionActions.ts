import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { DidCommAgent } from '../agent'
import { type ResolveOutOfBandInvitationResultSuccess, acceptOutOfBandInvitation } from '../invitation/resolver'
import { useAgent } from '../providers/AgentProvider'

export function useDidCommConnectionActions(resolved?: ResolveOutOfBandInvitationResultSuccess) {
  const { agent } = useAgent<DidCommAgent>()

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
