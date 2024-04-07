import {
  useAgent,
  parseInvitationUrl,
  receiveOutOfBandInvitation,
  parseDidCommInvitation,
} from '@internal/agent'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'solito/router'

export const useCredentialDataHandler = () => {
  const { push } = useRouter()
  const { agent } = useAgent()

  const handleCredentialData = async (dataUrl: string) => {
    const parseResult = await parseInvitationUrl(dataUrl)

    if (!parseResult.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return parseResult
    }

    const invitationData = parseResult.result
    if (invitationData.type === 'openid-credential-offer') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/openIdCredential',
        query: {
          uri:
            invitationData.format === 'url'
              ? encodeURIComponent(invitationData.data as string)
              : undefined,
          data:
            invitationData.format === 'parsed'
              ? encodeURIComponent(JSON.stringify(invitationData.data))
              : undefined,
        },
      })
      return { success: true } as const
    } else if (invitationData.type === 'openid-authorization-request') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/openIdPresentation',
        query: {
          uri:
            invitationData.format === 'url'
              ? encodeURIComponent(invitationData.data as string)
              : undefined,
          data:
            invitationData.format === 'parsed'
              ? encodeURIComponent(invitationData.data as string)
              : undefined,
        },
      })
      return { success: true } as const
    }
    // For DIDComm we first accept the invitation before we know where to navigate to
    else if (invitationData.type === 'didcomm') {
      const invitationResult = await parseDidCommInvitation(agent, dataUrl)
      if (!invitationResult.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return invitationResult
      }

      const result = await receiveOutOfBandInvitation(agent, invitationResult.result)

      // Error
      if (!result.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return result
      }

      // Credential exchange
      if (result.type === 'credentialExchange') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        push({
          pathname: '/notifications/didCommCredential',
          query: {
            credentialExchangeId: result.id,
          },
        })
        return { success: true } as const
      }
      // Proof Exchange
      else if (result.type === 'proofExchange') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        push({
          pathname: '/notifications/didCommPresentation',
          query: {
            proofExchangeId: result.id,
          },
        })
        return { success: true } as const
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return {
        success: false,
        error: 'Invitation not recognized.',
      } as const
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    return {
      success: false,
      error: 'Invitation not recognized.',
    } as const
  }

  return {
    handleCredentialData,
  }
}
