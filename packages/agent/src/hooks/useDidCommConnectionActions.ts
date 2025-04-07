import type { OutOfBandInvitation } from '@credo-ts/didcomm'
import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAgent } from '../agent'
import { type ResolveOutOfBandInvitationResultSuccess, acceptOutOfBandInvitation } from '../invitation'

const placeholder = {
  outOfBandInvitation: {
    id: 'placeholder',
    label: 'placeholder',
    imageUrl: 'https://example.com/logo.png',
  } as OutOfBandInvitation,
  existingConnection: {
    id: 'placeholder',
    alias: 'placeholder',
    theirLabel: 'placeholder',
    imageUrl: 'https://example.com/logo.png',
  },
  flowType: 'connect' as const,
}

export function useDidCommConnectionActions(resolved?: ResolveOutOfBandInvitationResultSuccess) {
  const { agent } = useAgent()
  const { outOfBandInvitation, existingConnection, flowType } = resolved ?? placeholder

  const { mutateAsync: acceptConnectionMutation, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommConnection', outOfBandInvitation.id],
    mutationFn: async () => {
      const result = await acceptOutOfBandInvitation(agent, outOfBandInvitation, flowType)
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
