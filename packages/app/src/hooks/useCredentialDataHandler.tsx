import { parseInvitationUrl } from '@package/agent'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'solito/router'

export const useCredentialDataHandler = () => {
  const { push } = useRouter()

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
          uri: invitationData.format === 'url' ? encodeURIComponent(invitationData.data as string) : undefined,
          data:
            invitationData.format === 'parsed' ? encodeURIComponent(JSON.stringify(invitationData.data)) : undefined,
        },
      })
      return { success: true } as const
    }
    if (invitationData.type === 'openid-authorization-request') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/openIdPresentation',
        query: {
          uri: invitationData.format === 'url' ? encodeURIComponent(invitationData.data as string) : undefined,
          data: invitationData.format === 'parsed' ? encodeURIComponent(invitationData.data as string) : undefined,
        },
      })
      return { success: true } as const
    }
    if (invitationData.type === 'didcomm') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/didcomm',
        query: {
          invitation:
            invitationData.format === 'parsed' ? encodeURIComponent(JSON.stringify(invitationData.data)) : undefined,
          invitationUrl:
            invitationData.format === 'url' ? encodeURIComponent(invitationData.data as string) : undefined,
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

  return {
    handleCredentialData,
  }
}
