import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { DidCommAgent } from '../agent'
import { type ResolveOutOfBandInvitationResult, acceptOutOfBandInvitation } from '../invitation/resolver'
import { useParadym } from './useParadym'

export function useDidCommConnectionActions(resolved?: ResolveOutOfBandInvitationResult) {
  const { paradym } = useParadym('unlocked')

  const { mutateAsync: acceptConnectionMutation, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommConnection', resolved?.outOfBandInvitation.id],
    mutationFn: async () => {
      if (!resolved) throw new Error("Missing 'resolved' parameter")

      const result = await acceptOutOfBandInvitation(
        paradym.agent as unknown as DidCommAgent,
        resolved.outOfBandInvitation,
        resolved.flowType
      )
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
          ? // TODO: translations used
            resolved.existingConnection?.alias ?? resolved.existingConnection?.theirLabel ?? 't(commonMessages.unknown)'
          : // TODO: translations used
            resolved?.outOfBandInvitation.label ?? 't(commonMessages.unknown)',
        logo: {
          url: resolved?.existingConnection
            ? resolved?.existingConnection.imageUrl
            : resolved?.outOfBandInvitation.imageUrl,
        },
      },
    },
  }
}
