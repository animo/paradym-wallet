import { parseInvitationUrl, type InvitationType, type ParseInvitationResultError } from '@package/agent'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'solito/router'

export const useCredentialDataHandler = () => {
  const { push } = useRouter()

  const handleCredentialData = async (
    dataUrl: string,
    options?: { allowedInvitationTypes?: Array<InvitationType> }
  ): Promise<
    | { success: true }
    | { success: false; error: ParseInvitationResultError | 'invitation_type_not_allowed'; message: string }
  > => {
    const parseResult = await parseInvitationUrl(dataUrl)

    if (!parseResult.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return parseResult
    }

    const invitationData = parseResult.result
    if (options?.allowedInvitationTypes && !options.allowedInvitationTypes.includes(invitationData.type)) {
      return {
        success: false,
        error: 'invitation_type_not_allowed',
        message: 'Invitation type not allowed',
      } as const
    }

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
      error: 'invitation_not_recognized',
      message: 'Invitation not recognized.',
    } as const
  }

  return {
    handleCredentialData,
  }
}
