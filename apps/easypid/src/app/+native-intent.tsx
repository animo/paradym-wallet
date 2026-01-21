import 'fast-text-encoding'

import { TypedArrayEncoder } from '@credo-ts/core'
import { appScheme, redirectBaseUrl } from '@easypid/constants'
import { deeplinkSchemes } from '@package/app'
import { LogLevel, ParadymWalletSdkConsoleLogger, parseInvitationUrlSync } from '@paradym/wallet-sdk'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { credentialDataHandlerOptions } from './(app)/_layout'

// NOTE: previously we had this method async, but somehow this prevent the
// deeplink from working on a cold startup. We updated the invitation handler to
// be fully sync.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  const logger = new ParadymWalletSdkConsoleLogger(LogLevel.trace)

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

    const parsedRedirectBaseUrl = redirectBaseUrl ? new URL(redirectBaseUrl) : undefined

    const isUniversalRedirect =
      parsedRedirectBaseUrl &&
      parsedRedirectBaseUrl.host === parsedPath.host &&
      parsedRedirectBaseUrl.pathname === parsedPath.pathname &&
      parsedRedirectBaseUrl.host === parsedPath.host

    const isDeeplinkRedirect = parsedPath.protocol === `${appScheme}:` && parsedPath.pathname === '/wallet/redirect'

    // TODO: we should handle if no `credentialAuthorizationCode` is present
    // but an `error` and `error_description` and set these so we can show the
    // error on the authorization screen. Or at least handle the flow correctly
    // currently it will just redirect as if there's an invitation to be processed.
    if ((isUniversalRedirect || isDeeplinkRedirect) && credentialAuthorizationCode) {
      logger.debug(
        'Link is redirect after authorization code flow. Setting credentialAuthorizationCode search param, but not routing to any screen',
        {
          credentialAuthorizationCode,
        }
      )
      // We just set the credentialAuthorizationCode, which should be handled by the browser
      // auth session code in the credential screen that is open.
      router.setParams({ credentialAuthorizationCode })
      return null
    }

    try {
      const invitationData = parseInvitationUrlSync(path)
      let redirectPath: string | undefined

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
        redirectPath = `/notifications/didcomm?invitationUrl=${encodeURIComponent(invitationData.data)}`
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
      logger.info('Deeplink is not a valid invitation. Routing to home screen', {
        error: error,
        message: (error as Error).message,
      })

      return '/'
    }
  } catch (_error) {
    return '/'
  }
}
