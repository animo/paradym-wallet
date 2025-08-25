import 'fast-text-encoding'

import { TypedArrayEncoder } from '@credo-ts/core'
import { appScheme } from '@easypid/constants'
import { logger, parseInvitationUrlSync } from '@package/agent'
import { deeplinkSchemes } from '@package/app'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { credentialDataHandlerOptions } from './(app)/_layout'

// NOTE: previously we had this method async, but somehow this prevent the
// deeplink from working on a cold startup. We updated the invitation handler to
// be fully sync.
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string
  initial: boolean
}) {
  logger.debug(`Handling deeplink for path ${path}.`, {
    initial,
  })

  const isRecognizedDeeplink = deeplinkSchemes.some((scheme) => path.startsWith(scheme))
  if (!isRecognizedDeeplink) {
    logger.debug(
      'Deeplink is not a recognized deeplink scheme, routing to deeplink directly instead of parsing as invitation.'
    )
    return path
  }

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
      logger.debug(
        'Deeplink is redirect after authorization code flow. Setting credentialAuthorizationCode search param, but not routing to any screen',
        {
          credentialAuthorizationCode,
        }
      )
      // We just set the credentialAuthorizationCode, which should be handled by the browser
      // auth session code in the credential screen that is open.
      router.setParams({ credentialAuthorizationCode })
      return null
    }

    const parseResult = parseInvitationUrlSync(path)
    if (!parseResult.success) {
      logger.error('Error parsing invitation. Routing to home screen', {
        error: parseResult.error,
        message: parseResult.message,
      })

      return '/'
    }

    const invitationData = parseResult.result

    let redirectPath: string | undefined = undefined

    if (!credentialDataHandlerOptions.allowedInvitationTypes.includes(invitationData.type)) {
      logger.warn(`Invitation type ${invitationData.type} is not allowed. Routing to home screen`)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return '/'
    }

    if (invitationData.type === 'openid-credential-offer') {
      redirectPath = `/notifications/openIdCredential?uri=${encodeURIComponent(invitationData.data)}`
    }
    if (invitationData.type === 'openid-authorization-request') {
      redirectPath = `/notifications/openIdPresentation?uri=${encodeURIComponent(invitationData.data)}`
    }
    if (invitationData.type === 'didcomm') {
      redirectPath = `/notifications/didcomm?uri=${encodeURIComponent(invitationData.data)}`
    }

    if (redirectPath) {
      // Always make the user authenticate first when opening with a deeplink
      // On initial load this is already the case so we skip it
      if (!initial) {
        const encodedRedirect = TypedArrayEncoder.toBase64URL(TypedArrayEncoder.fromString(redirectPath))
        redirectPath = `/authenticate?redirectAfterUnlock=${encodedRedirect}`
      }

      logger.debug(`Redirecting to path ${redirectPath}`)
      return redirectPath
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    return '/'
  } catch (error) {
    return '/'
  }
}
