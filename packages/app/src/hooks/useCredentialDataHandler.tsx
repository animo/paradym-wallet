import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import {
  type InvitationType,
  type ParadymWalletInvitationParseError,
  parseInvitationUrl,
  useParadym,
} from '@paradym/wallet-sdk'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'

export interface CredentialDataHandlerOptions {
  allowedInvitationTypes?: Array<InvitationType>
  routeMethod?: 'push' | 'replace'
}

export const useCredentialDataHandler = () => {
  const { push, replace } = useRouter()
  const { t } = useLingui()
  const { paradym } = useParadym('unlocked')

  const handleCredentialData = async (
    dataUrl: string,
    options?: CredentialDataHandlerOptions
  ): Promise<
    | { success: true }
    | {
        success: false
        error: ParadymWalletInvitationParseError | 'invitation_type_not_allowed'
        message: string
      }
  > => {
    try {
      const invitationData = await parseInvitationUrl(paradym, dataUrl)
      const routeMethodName = options?.routeMethod ?? 'push'
      const routeMethod = routeMethodName === 'push' ? push : replace

      if (options?.allowedInvitationTypes && !options.allowedInvitationTypes.includes(invitationData.type)) {
        return {
          success: false,
          error: 'invitation_type_not_allowed',
          message: t(commonMessages.invitationTypeNotAllowed),
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
        error: 'invitation_type_not_allowed',
        message: `Could not find handler for type: '${invitationData.type}'`,
      }
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return {
        success: false,
        error: 'invitation_type_not_allowed',
        message: (e as Error).message,
      }
    }
  }

  return {
    handleCredentialData,
  }
}
