import 'fast-text-encoding'

import { parseInvitationUrl } from '@package/agent'
import { deeplinkSchemes } from '@package/app'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'

export async function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  const isRecognizedDeeplink = deeplinkSchemes.some((scheme) => path.startsWith(scheme))
  if (!isRecognizedDeeplink) return path

  try {
    const parseResult = await parseInvitationUrl(path)
    if (!parseResult.success) {
      return '/'
    }

    const invitationData = parseResult.result

    let redirectPath: string | undefined = undefined

    if (invitationData.type === 'openid-credential-offer') {
      redirectPath = `/(app)/notifications/openIdCredential?${invitationData.format === 'url' ? 'uri' : 'data'}=${encodeURIComponent(invitationData.format === 'parsed' ? JSON.stringify(invitationData.data) : (invitationData.data as string))}`
    }
    if (invitationData.type === 'openid-authorization-request') {
      redirectPath = `/(app)/notifications/openIdPresentation?${invitationData.format === 'url' ? 'uri' : 'data'}=${encodeURIComponent(invitationData.format === 'parsed' ? JSON.stringify(invitationData.data) : (invitationData.data as string))}`
    }
    if (invitationData.type === 'didcomm') {
      redirectPath = `/notifications/didcomm?${invitationData.format === 'url' ? 'invitationUrl' : 'invitation'}=${encodeURIComponent(invitationData.format === 'parsed' ? JSON.stringify(invitationData.data) : (invitationData.data as string))}`
    }

    if (redirectPath) {
      // NOTE: it somehow doesn't handle the intent if the app is already open
      // so we replace the router to the path. I think it can break easily though if e.g.
      // the wallet is locked in the background. Not sure how to proceed, this is best effort fix
      if (!initial) {
        router.replace(redirectPath)
        return null
      }
      return redirectPath
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
