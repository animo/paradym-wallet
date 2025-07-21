import 'fast-text-encoding'

import { appScheme } from '@easypid/constants'
import { parseInvitationUrl } from '@package/agent'
import { deeplinkSchemes } from '@package/app'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { credentialDataHandlerOptions } from './(app)/_layout'
import { t } from '@lingui/core/macro'

export async function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  const isRecognizedDeeplink = deeplinkSchemes.some((scheme) => path.startsWith(scheme))
  if (!isRecognizedDeeplink) return path

  try {
    // For the bdr mDL issuer we use authorized code flow, but they also
    // redirect to the ausweis app. From the ausweis app we are then redirected
    // back to the easypid wallet.
    const parsedPath = new URL(path)
    const credentialAuthorizationCode = parsedPath.searchParams.get('code')
    if (
      parsedPath.protocol === `${appScheme}:` &&
      parsedPath.pathname === '/wallet/redirect' &&
      credentialAuthorizationCode
    ) {
      // We just set the credentialAuthorizationCode, which should be handled by the browser
      // auth session code in the credential screen that is open.
      router.setParams({ credentialAuthorizationCode })
      return null
    }

    const parseResult = await parseInvitationUrl(path)
    if (!parseResult.success) {
      return '/'
    }

    const invitationData = parseResult.result

    let redirectPath: string | undefined = undefined

    if (!credentialDataHandlerOptions.allowedInvitationTypes.includes(invitationData.type)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return {
        success: false,
        error: 'invitation_not_supported',
        message: t({
          id: 'deeplink.invitationNotSupported',
          message: 'Invitation not supported.',
          comment: 'Error message shown when the type of invitation is not supported by the wallet',
        }),
      } as const
    }

    if (invitationData.type === 'openid-credential-offer') {
      redirectPath = `/(app)/notifications/openIdCredential?uri=${encodeURIComponent(invitationData.data)}`
    }
    if (invitationData.type === 'openid-authorization-request') {
      redirectPath = `/(app)/notifications/openIdPresentation?uri=${encodeURIComponent(invitationData.data)}`
    }
    if (invitationData.type === 'didcomm') {
      redirectPath = `/(app)/notifications/didcomm?uri=${encodeURIComponent(invitationData.data)}`
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
      message: t({
        id: 'deeplink.invitationNotRecognized',
        message: 'Invitation not recognized.',
        comment: 'Error message shown when the invitation URL could not be parsed or recognized',
      }),
    } as const

  } catch (error) {
    return '/'
  }
}
