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
          // TODO: translations used
          ? resolved.existingConnection?.alias ?? resolved.existingConnection?.theirLabel ?? `t(commonMessages.unknown)`
          // TODO: translations used
          : resolved?.outOfBandInvitation.label ?? `t(commonMessages.unknown)`,
        logo: {
          url: resolved?.existingConnection
            ? resolved?.existingConnection.imageUrl
            : resolved?.outOfBandInvitation.imageUrl,
        },
      },
    },
  }
}
