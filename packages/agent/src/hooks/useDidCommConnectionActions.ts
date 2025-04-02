import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAgent } from '../agent'
import { type ResolveOutOfBandInvitationResultSuccess, acceptOutOfBandInvitation } from '../invitation'

export function useDidCommConnectionActions(resolved: ResolveOutOfBandInvitationResultSuccess) {
  const { agent } = useAgent()
  const { outOfBandInvitation, existingConnection } = resolved

  const { mutateAsync: acceptConnectionMutation, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommConnection', outOfBandInvitation.id],
    mutationFn: async () => {
      const result = await acceptOutOfBandInvitation(agent, outOfBandInvitation, resolved.flowType)
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
        name: existingConnection
          ? existingConnection?.alias ?? existingConnection?.theirLabel ?? 'Unknown'
          : outOfBandInvitation.label ?? 'Unknown',
        logo: {
          url: existingConnection ? existingConnection.imageUrl : outOfBandInvitation.imageUrl,
        },
      },
    },
  }
}
