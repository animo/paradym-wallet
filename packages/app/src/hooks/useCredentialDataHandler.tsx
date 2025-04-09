import { type InvitationType, type ParseInvitationResultError, parseInvitationUrl } from '@package/agent'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'

export interface CredentialDataHandlerOptions {
  allowedInvitationTypes?: Array<InvitationType>
  routeMethod?: 'push' | 'replace'
}

export const useCredentialDataHandler = () => {
  const { push, replace } = useRouter()

  const handleCredentialData = async (
    dataUrl: string,
    options?: CredentialDataHandlerOptions
  ): Promise<
    | { success: true }
    | { success: false; error: ParseInvitationResultError | 'invitation_type_not_allowed'; message: string }
  > => {
    const parseResult = await parseInvitationUrl(dataUrl)
    const routeMethodName = options?.routeMethod ?? 'push'
    const routeMethod = routeMethodName === 'push' ? push : replace

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
      routeMethod({
        pathname: '/notifications/openIdCredential',
        params: {
          uri: encodeURIComponent(invitationData.data),
        },
      })
      return { success: true } as const
    }
    if (invitationData.type === 'openid-authorization-request') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      routeMethod({
        pathname: '/notifications/openIdPresentation',
        params: {
          uri: encodeURIComponent(invitationData.data),
        },
      })
      return { success: true } as const
    }
    if (invitationData.type === 'didcomm') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      routeMethod({
        pathname: '/notifications/didcomm',
        params: {
          invitationUrl: encodeURIComponent(invitationData.data),
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
