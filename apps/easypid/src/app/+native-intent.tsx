import { parseInvitationUrl } from '@package/agent'
import { deeplinkSchemes } from '@package/app'
import * as Haptics from 'expo-haptics'

export async function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  const isRecognizedDeeplink = deeplinkSchemes.some((scheme) => path.startsWith(scheme))
  if (!isRecognizedDeeplink) return path

  try {
    const parseResult = await parseInvitationUrl(path)
    if (!parseResult.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return '/'
    }

    const invitationData = parseResult.result

    if (invitationData.type === 'openid-credential-offer') {
      return `/notifications/openIdCredential?${invitationData.format === 'url' ? 'uri' : 'data'}=${encodeURIComponent(invitationData.format === 'parsed' ? JSON.stringify(invitationData.data) : (invitationData.data as string))}`
    }
    if (invitationData.type === 'openid-authorization-request') {
      return `//notifications/openIdPresentation?${invitationData.format === 'url' ? 'uri' : 'data'}=${encodeURIComponent(invitationData.format === 'parsed' ? JSON.stringify(invitationData.data) : (invitationData.data as string))}`
    }
    if (invitationData.type === 'didcomm') {
      return `/(app)/notifications/didcomm?${invitationData.format === 'url' ? 'invitationUrl' : 'invitation'}=${encodeURIComponent(invitationData.format === 'parsed' ? JSON.stringify(invitationData.data) : (invitationData.data as string))}`
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    return {
      success: false,
      error: 'invitation_not_recognized',
      message: 'Invitation not recognized.',
    } as const
  } catch (error) {
    return '/'
  }
}
