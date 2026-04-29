import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { WalletFlowErrorContent, WalletFlowShell } from '@easypid/features/flow/WalletFlowShell'
import { useHasFinishedOnboarding } from '@easypid/features/onboarding'
import { useLingui } from '@lingui/react/macro'
import { BackgroundLockProvider, NoInternetToastProvider, Provider } from '@package/app'
import { commonMessages } from '@package/translations'
import { YStack } from '@package/ui'
import {
  activityStorage,
  deferredCredentialStorage,
  ParadymWalletSdk,
  parseInvitationUrlSync,
  useParadym,
} from '@paradym/wallet-sdk'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useEffect, useMemo, useState } from 'react'
import { NativeModules } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'
import { FunkeCredentialNotificationFlow } from '../receive/FunkeOpenIdCredentialNotificationScreen'
import { FunkeOpenIdPresentationNotificationFlow } from '../share/FunkeOpenIdPresentationNotificationScreen'

type DeepLinkOverlayRootProps = {
  initialUrl?: string
}

type OverlayRequest =
  | {
      type: 'credential'
      uri: string
    }
  | {
      type: 'presentation'
      uri: string
    }

const jsonRecordIds = [activityStorage.recordId, deferredCredentialStorage.recordId]

function finishOverlayTask() {
  NativeModules.DeepLinkOverlayControl?.finishOverlayTask?.()
}

function resolveOverlayRequest(initialUrl?: string): OverlayRequest | undefined {
  if (!initialUrl) return undefined

  const invitation = parseInvitationUrlSync(initialUrl)

  if (invitation.type === 'openid-credential-offer') {
    return { type: 'credential', uri: invitation.data }
  }

  if (invitation.type === 'openid-authorization-request') {
    return { type: 'presentation', uri: invitation.data }
  }

  return undefined
}

function OverlayError({ message }: { message: string }) {
  const { t } = useLingui()

  return (
    <WalletFlowShell surface="overlay" title={t(commonMessages.somethingWentWrong)} onCancel={finishOverlayTask}>
      <WalletFlowErrorContent message={message} onClose={finishOverlayTask} />
    </WalletFlowShell>
  )
}

function OverlayUnlockGate({ request }: { request?: OverlayRequest }) {
  const { t } = useLingui()
  const paradym = useParadym()
  const [hasFinishedOnboarding] = useHasFinishedOnboarding()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const shouldResetWallet =
    paradym.state !== 'not-configured' && paradym.state !== 'initializing' && !hasFinishedOnboarding

  useEffect(() => {
    if (paradym.state !== 'acquired-wallet-key' || isUnlocking) return

    setIsUnlocking(true)
    paradym
      .unlock()
      .catch(() => undefined)
      .finally(() => setIsUnlocking(false))
  }, [isUnlocking, paradym])

  const onUnlock = async ({ pin, onAuthorizationError, onAuthorized }: OnWalletAuthSubmitProps = {}) => {
    setIsUnlocking(true)
    try {
      if (paradym.state === 'locked') {
        if (pin) {
          await paradym.unlockUsingPin(pin)
        } else {
          await paradym.tryUnlockingUsingBiometrics()
        }
      }

      onAuthorized?.()
    } catch {
      onAuthorizationError?.()
    } finally {
      setIsUnlocking(false)
    }
  }

  if (!request) {
    return (
      <OverlayError
        message={t({
          id: 'overlay.unsupportedRequest',
          message: 'This external wallet request is not supported.',
          comment: 'Shown when a deeplink overlay cannot parse the request',
        })}
      />
    )
  }

  if (paradym.state === 'not-configured' || shouldResetWallet) {
    return (
      <OverlayError
        message={t({
          id: 'overlay.walletNotReady',
          message: 'Set up the wallet before using external requests.',
          comment: 'Shown when an external overlay is opened before onboarding is complete',
        })}
      />
    )
  }

  if (paradym.state === 'initializing') {
    return (
      <WalletFlowShell
        surface="overlay"
        title={t({
          id: 'overlay.loadingTitle',
          message: 'Preparing request',
          comment: 'Title shown while the transparent overlay initializes the wallet',
        })}
        isLoading
        onCancel={finishOverlayTask}
      >
        <YStack />
      </WalletFlowShell>
    )
  }

  if (paradym.state === 'locked' || paradym.state === 'acquired-wallet-key') {
    return (
      <WalletFlowShell
        surface="overlay"
        title={t({
          id: 'overlay.unlockTitle',
          message: 'Unlock wallet',
          comment: 'Title shown when an external overlay needs wallet unlock',
        })}
        onCancel={finishOverlayTask}
      >
        <WalletFlowAuthPrompt authMode="pin-or-biometrics" onSubmit={onUnlock} isLoading={isUnlocking} />
      </WalletFlowShell>
    )
  }

  return (
    <ParadymWalletSdk.AppProvider recordIds={jsonRecordIds}>
      {request.type === 'credential' ? (
        <FunkeCredentialNotificationFlow
          source="external"
          routeParams={{ uri: request.uri }}
          onExit={finishOverlayTask}
        />
      ) : (
        <FunkeOpenIdPresentationNotificationFlow
          source="external"
          routeParams={{ uri: request.uri }}
          onExit={finishOverlayTask}
        />
      )}
    </ParadymWalletSdk.AppProvider>
  )
}

export function DeepLinkOverlayRoot({ initialUrl }: DeepLinkOverlayRootProps) {
  const [storedLocale] = useStoredLocale()
  const request = useMemo(() => {
    try {
      return resolveOverlayRequest(initialUrl)
    } catch {
      return undefined
    }
  }, [initialUrl])

  return (
    <Provider config={tamaguiConfig} customLocale={storedLocale} rootBackgroundColor="transparent">
      <SystemBars style="dark" />
      <ThemeProvider
        value={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: 'transparent',
          },
        }}
      >
        <BackgroundLockProvider>
          <NoInternetToastProvider>
            <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
              <OverlayUnlockGate request={request} />
            </ParadymWalletSdk.UnlockProvider>
          </NoInternetToastProvider>
        </BackgroundLockProvider>
      </ThemeProvider>
    </Provider>
  )
}
