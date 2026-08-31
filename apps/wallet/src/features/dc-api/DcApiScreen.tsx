import type { DcApiRequest } from '@animo-id/expo-digital-credentials-api/request-handler'
// Deep import: `@app/hooks` pulls in the over-asking AI and the payment hooks, none of which this
// bundle links. The setting itself lives in the shared MMKV, so the request UI reads what the app
// wrote — in its own process, on iOS.
import { useDevelopmentMode } from '@app/hooks/useDevelopmentMode'
import { useLingui } from '@lingui/react/macro'
// Deep imports throughout: the `@package/ui` and `@package/app` barrels pull in the whole kit —
// the icon sets alone are thousands of modules — and this bundle is separate from the app's.
import { PinDotsInput, type PinDotsInputRef } from '@package/app/components/PinDotsInput'
import { commonMessages, TranslationProvider } from '@package/translations'
import { Button } from '@package/ui/base/Button'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { ScrollView } from '@package/ui/base/ScrollView'
import { Stack, XStack, YStack } from '@package/ui/base/Stacks'
import { HeroIcons } from '@package/ui/content/Icon'
import { IconContainer } from '@package/ui/content/IconContainer'
import { Spinner } from '@package/ui/content/Spinner'
import type { DcApiReview, ParadymDcApiSdk } from '@paradym/wallet-sdk/dcApi/ParadymDcApiSdk'
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletNoStoreError,
} from '@paradym/wallet-sdk/error'
import { getIsBiometricsEnabled } from '@paradym/wallet-sdk/storage/sharedMmkv'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, useColorScheme } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'
import { DcApiRequestedCards } from './components/DcApiRequestedCards'
import { DcApiVerifierSection } from './components/DcApiVerifierSection'
import { dcApiMessages as messages } from './messages'

// Credo, askar and keychain are imported lazily: anything they throw while initializing would
// otherwise happen during bundle evaluation, before the screen is registered, and the request UI
// would die without being able to show the error. The wallet configuration is lazy for the same
// reason — it names Credo's log levels, and expo-constants reads the app config.
/**
 * Whether the screen has to draw the sheet itself.
 *
 * Android hosts the request UI in a transparent activity over the verifier's app, so the screen is
 * the sheet: it sits at the bottom, rounds its own top and keeps its own height. iOS presents the
 * provider extension in a system sheet that is already full height and already titled, so the same
 * treatment would only put a sheet inside a sheet — there the screen fills what it is given.
 */
const drawsOwnSheet = Platform.OS !== 'ios'

const dcApiSdk = () => import('@paradym/wallet-sdk/dcApi/ParadymDcApiSdk')
const paradymConfiguration = () => import('@app/config/paradym')
const walletKey = () => import('@paradym/wallet-sdk/secure/walletKey')
const walletKeyVersion = () => import('@paradym/wallet-sdk/storage/sharedMmkv')

type UnlockMethod = 'pin' | 'biometrics'

type Phase =
  | { name: 'unlock' }
  // Carries the method, because the two look different while they wait: a pin unlock keeps the pad
  // with its dots animating, the way the app's own lock screen does, and biometrics has no pad.
  | { name: 'opening'; method: UnlockMethod }
  | { name: 'review'; review: DcApiReview }
  // Carries the review it was approved from: sharing keeps the request on screen with the share
  // button in a loading state, rather than replacing what the user just agreed to with a spinner.
  | { name: 'sharing'; review: DcApiReview }
  // Terminal: the wallet was already open when this failed, so there is nothing left for the user
  // to retry — the request is declined when they close the screen. `reason` is the underlying
  // error, which goes to the OS as the decline reason and is only shown with development mode
  // enabled. `stage` only picks which sentence is shown: whether the request could not be read at
  // all, or the card could not be sent after it was approved.
  | { name: 'failed'; stage: 'review' | 'share'; reason: string }

/**
 * Credential request UI, on both platforms.
 *
 * The wallet is locked when a request arrives, so the user unlocks first; only then can the wallet
 * see which of its credentials answer the request, and only then is there anything to approve.
 *
 * It is bundled separately from the app — inside the identity document provider extension on iOS,
 * in the activity the credential picker launches on Android — so it cannot use the app's
 * navigation, and imports the shared components directly rather than through their barrels.
 */
export function DcApiScreen({ request }: { request: DcApiRequest }) {
  const [storedLocale] = useStoredLocale()
  // The app is pinned to light, but the request UI is presented by the OS in a sheet whose title
  // the OS draws in the device's appearance and which cannot be styled from the extension. Pinned
  // to light, that title is white on white as soon as the device is dark — so this one screen
  // follows the device instead.
  const colorScheme = useColorScheme()

  return (
    <TranslationProvider customLocale={storedLocale}>
      <TamaguiProvider disableInjectCSS defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'} config={tamaguiConfig}>
        <SafeAreaProvider>
          <Stack flex-1 justifyContent={drawsOwnSheet ? 'flex-end' : 'flex-start'}>
            <DcApiScreenContent request={request} />
          </Stack>
        </SafeAreaProvider>
      </TamaguiProvider>
    </TranslationProvider>
  )
}

function DcApiScreenContent({ request }: { request: DcApiRequest }) {
  const { t } = useLingui()
  const insets = useSafeAreaInsets()
  const pinRef = useRef<PinDotsInputRef>(null)
  const [phase, setPhase] = useState<Phase>({ name: 'unlock' })
  const [error, setError] = useState<string>()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  // The SDK holds the askar store open, so it outlives the phase it was created in.
  const sdkRef = useRef<ParadymDcApiSdk | undefined>(undefined)
  useEffect(() => () => void sdkRef.current?.shutdown(), [])

  const decline = useCallback(() => request.decline(t(messages.declined)), [request, t])

  const unlock = useCallback(
    async (method: UnlockMethod, getKey: (version: number) => Promise<string | null>) => {
      setError(undefined)
      setPhase({ name: 'opening', method })

      let sdk: ParadymDcApiSdk
      // Opening the wallet. Everything that fails here is something the user can answer for — a
      // wrong pin, a dismissed biometric prompt — so it goes back to the pad to be tried again.
      try {
        const { getWalletKeyVersion } = await walletKeyVersion()
        const key = await getKey(getWalletKeyVersion())
        if (!key) {
          setPhase({ name: 'unlock' })
          setError(t(messages.biometricsUnavailable))
          return
        }

        // The app's own configuration, unchanged: the request UI has to trust exactly what the app
        // trusts, down to the `getTrustedCertificatesForVerification` callback.
        const [{ ParadymDcApiSdk }, { paradymWalletSdkOptions }] = await Promise.all([
          dcApiSdk(),
          paradymConfiguration(),
        ])
        sdk = await ParadymDcApiSdk.initialize({ ...paradymWalletSdkOptions, walletKey: key })
        sdkRef.current = sdk
      } catch (unlockError) {
        setPhase({ name: 'unlock' })
        console.error('Error unlocking wallet', unlockError)
        // A cancelled biometric prompt is the user choosing the pin pad, not a failure.
        setError(
          unlockError instanceof ParadymWalletBiometricAuthenticationCancelledError
            ? undefined
            : unlockMessage(unlockError, t)
        )
        pinRef.current?.clear()
        return
      }

      // Reading the request. The wallet is open now, so retyping the pin would only run the same
      // request into the same wall — a bad request, an untrusted verifier, an origin the wallet
      // cannot place. Android does this work here, where iOS cannot get at the request until
      // `approve()` and fails inside `share` instead; both end on the same screen.
      try {
        const review = await sdk.reviewRequest(request)
        setPhase({ name: 'review', review })
      } catch (reviewError) {
        console.error('Error reviewing request', reviewError)
        setPhase({ name: 'failed', stage: 'review', reason: message(reviewError) })
      }
    },
    [request, t]
  )

  const unlockUsingPin = useCallback(
    (pin: string) => unlock('pin', async (version) => (await walletKey()).getWalletKeyUsingPin(pin, version)),
    [unlock]
  )

  const unlockUsingBiometrics = useCallback(
    () => unlock('biometrics', async (version) => (await walletKey()).getWalletKeyUsingBiometrics(version)),
    [unlock]
  )

  // Biometrics is the fast path, so it is offered before the pin pad rather than behind it. Once
  // only: a cancelled prompt should leave the user on the pin pad, not prompt again.
  const hasTriedBiometrics = useRef(false)
  useEffect(() => {
    if (hasTriedBiometrics.current) return
    hasTriedBiometrics.current = true

    if (getIsBiometricsEnabled()) void unlockUsingBiometrics()
  }, [unlockUsingBiometrics])

  const share = useCallback(async (review: DcApiReview) => {
    setError(undefined)
    setPhase({ name: 'sharing', review })

    try {
      await review.share()
    } catch (shareError) {
      console.error('Error sharing credentials', shareError)
      // On iOS `approve()` has already released the request by the time most failures happen, so
      // there is nothing to retry. The request is declined from the failure screen rather than
      // here: declining takes the UI down with it, and the user would never see what went wrong.
      setPhase({ name: 'failed', stage: 'share', reason: message(shareError) })
    }
  }, [])

  return (
    <YStack
      // On iOS the system sheet is the whole surface, so the screen fills it instead of drawing a
      // second one inside it. See `drawsOwnSheet`.
      flex-1={!drawsOwnSheet}
      borderTopLeftRadius={drawsOwnSheet ? '$8' : undefined}
      borderTopRightRadius={drawsOwnSheet ? '$8' : undefined}
      backgroundColor="$background"
      gap="$4"
      pt="$5"
      px="$4"
      paddingBottom={insets.bottom || '$6'}
      // The Android sheet sits on top of the verifier's app, so it can never take the whole screen:
      // the request keeps its own height and the review scrolls inside it.
      maxHeight={drawsOwnSheet ? '85%' : undefined}
    >
      {/* A full-height sheet gets the app's own unlock screen: the lock, the heading and the origin
          centred just above the pad, rather than a left-aligned heading with the screen empty under
          it. The Android sheet is only as tall as its content, so it keeps the compact heading. */}
      {isUnlocking(phase) && !drawsOwnSheet ? (
        // Sits just above the pad while there is one to sit above, and takes the whole sheet once
        // there is not: unlocking through biometrics has no pad, so the same block bottom-aligned
        // would hug the bottom of an otherwise empty screen.
        <YStack
          flex-1
          alignItems="center"
          justifyContent={showsPinPad(phase) ? 'flex-end' : 'center'}
          gap="$4"
          pb={showsPinPad(phase) ? '$6' : undefined}
        >
          <IconContainer h="$4" w="$4" ai="center" jc="center" icon={<HeroIcons.LockClosedFilled />} />
          <YStack gap="$2" alignItems="center">
            <Heading heading="h2" fontWeight="$semiBold" textAlign="center">
              {t(messages.unlockTitle)}
            </Heading>
            <Paragraph variant="annotation" textAlign="center">
              {t(messages.unlockSubtitle(request.origin || t(commonMessages.unknownOrganization)))}
            </Paragraph>
          </YStack>
          {phase.name === 'opening' && !showsPinPad(phase) ? (
            <Stack pt="$2">
              <Spinner />
            </Stack>
          ) : null}
        </YStack>
      ) : null}

      {isUnlocking(phase) && drawsOwnSheet ? (
        <YStack>
          <Heading>{t(messages.unlockTitle)}</Heading>
          <Paragraph variant="annotation">
            {t(messages.unlockSubtitle(request.origin || t(commonMessages.unknownOrganization)))}
          </Paragraph>
        </YStack>
      ) : null}

      {phase.name === 'review' || phase.name === 'sharing' ? (
        <ScrollView
          // Shrinks into whatever the sheet's max height leaves it, which is what makes it scroll
          // rather than push the buttons off the screen. On a full-height sheet it grows into the
          // space instead, so the buttons stay at the bottom of the screen.
          flexShrink={1}
          flexGrow={drawsOwnSheet ? 0 : 1}
          contentContainerStyle={{ gap: '$5', paddingBottom: '$4' }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <DcApiVerifierSection verifier={phase.review.verifier} origin={request.origin} />
          <DcApiRequestedCards submission={phase.review.submission} />
        </ScrollView>
      ) : null}

      {phase.name === 'failed' ? (
        <ScrollView
          flexShrink={1}
          flexGrow={drawsOwnSheet ? 0 : 1}
          contentContainerStyle={{ gap: '$4' }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Heading>{t(commonMessages.somethingWentWrong)}</Heading>
          <Stack alignSelf="flex-start">
            <XStack p="$4" bg="$grey-100" borderRadius="$4">
              <HeroIcons.NoSymbol color="$grey-800" size={32} />
            </XStack>
          </Stack>
          <Paragraph>{t(phase.stage === 'review' ? messages.requestFailed : messages.shareFailed)}</Paragraph>

          {/* The error itself says nothing a user can act on, so it is kept for the people who can:
              the same development mode setting the app shows its own errors behind. */}
          {isDevelopmentModeEnabled ? (
            <Paragraph variant="sub">
              <Paragraph variant="caption">{t(messages.errorReasonPrefix)} </Paragraph>
              {phase.reason}
            </Paragraph>
          ) : null}
        </ScrollView>
      ) : null}

      {error ? <Paragraph color="$danger-500">{error}</Paragraph> : null}

      {showsPinPad(phase) ? (
        // Kept mounted across the phase change: `isLoading` fills the dots and animates them while
        // the wallet opens, which is the app's own lock screen, and it ignores taps meanwhile.
        <Stack pt="$4" gap="$4">
          <PinDotsInput
            ref={pinRef}
            pinLength={6}
            isLoading={phase.name === 'opening'}
            onPinComplete={unlockUsingPin}
            onBiometricsTap={unlockUsingBiometrics}
            useNativeKeyboard={false}
          />
        </Stack>
      ) : phase.name === 'opening' ? (
        // The full-height sheet centres its own spinner with the heading above; this is the compact
        // sheet's, where the pad would be, so the heading does not jump as the phase changes.
        drawsOwnSheet ? (
          <Stack alignItems="center" py="$6">
            <Spinner />
          </Stack>
        ) : null
      ) : phase.name === 'failed' ? (
        // Closing is what declines: the request is still open until then, and the verifier is told
        // why rather than being left to time out.
        <Stack btw="$0.5" borderColor="$grey-200" mx="$-4" px="$4" pt="$4">
          <Button.Solid onPress={() => request.decline(phase.reason)}>{t(commonMessages.close)}</Button.Solid>
        </Stack>
      ) : phase.name === 'review' || phase.name === 'sharing' ? (
        <XStack gap="$2" btw="$0.5" borderColor="$grey-200" mx="$-4" px="$4" pt="$4">
          {/* Both are disabled while the response is being built: it cannot be taken back once
              `approve()` has released the request, so there is nothing a second press could do. */}
          <Button.Outline fg={1} disabled={phase.name === 'sharing'} onPress={decline}>
            {t(commonMessages.declineButton)}
          </Button.Outline>
          <Button.Solid
            fg={1}
            disabled={phase.name === 'sharing' || !canShare(phase.review)}
            onPress={() => share(phase.review)}
          >
            {phase.name === 'sharing' ? <Spinner variant="dark" /> : t(messages.share)}
          </Button.Solid>
        </XStack>
      ) : null}
    </YStack>
  )
}

/**
 * Whether the pin pad is on screen: while it is waiting to be used, and while the pin typed into it
 * is being checked. Unlocking through biometrics never shows it.
 */
function showsPinPad(phase: Phase) {
  return phase.name === 'unlock' || (phase.name === 'opening' && phase.method === 'pin')
}

/**
 * Whether the unlock heading belongs on screen: the phases before the wallet is open, where the
 * origin is all there is to say. From `review` on, the request itself is the heading.
 */
function isUnlocking(phase: Phase) {
  return phase.name === 'unlock' || phase.name === 'opening'
}

/** Every requested card has to have a credential behind it before anything can be shared. */
function canShare(review: DcApiReview) {
  return review.submission.entries.length > 0 && review.submission.areAllSatisfied
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The two ways unlocking fails that the user can do something about. Anything else is shown as it
 * came, since there is nothing better to say about it.
 */
function unlockMessage(error: unknown, t: ReturnType<typeof useLingui>['t']) {
  if (error instanceof ParadymWalletAuthenticationInvalidPinError) return t(commonMessages.invalidPinEntered)
  if (error instanceof ParadymWalletNoStoreError) return t(messages.openWalletFirst)

  return message(error)
}
