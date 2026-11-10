import type { DcApiRequest } from '@animo-id/expo-digital-credentials-api/request-handler'
import { isHardwareBoundCredentialType } from '@app/config/paymentAttestation'
import { useBiometricsType } from '@app/hooks/useBiometricsType'
// Deep import: `@app/hooks` pulls in the payment hooks, which this bundle doesn't link. The setting
// itself lives in the shared MMKV, so the request UI reads what the app wrote — in its own process.
import { useDevelopmentMode } from '@app/hooks/useDevelopmentMode'
import { getUnmetAttributeMessages } from '@app/utils/unmetAttributeMessages'
import { Trans, useLingui } from '@lingui/react/macro'
// Deep imports throughout: the `@package/ui` and `@package/app` barrels pull in the whole kit —
// the icon sets alone are thousands of modules — and this bundle is separate from the app's.
import { PinDotsInput, type PinDotsInputRef } from '@package/app/components/PinDotsInput'
import { commonMessages, i18n, TranslationProvider } from '@package/translations'
import { Button } from '@package/ui/base/Button'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph, type ParagraphProps } from '@package/ui/base/Paragraph'
import { ScrollView } from '@package/ui/base/ScrollView'
import { Stack, XStack, YStack } from '@package/ui/base/Stacks'
import { HeroIcons } from '@package/ui/content/Icon'
import { IconContainer } from '@package/ui/content/IconContainer'
import { Spinner } from '@package/ui/content/Spinner'
import type { DcApiReview, DcApiShareOptions, ParadymDcApiSdk } from '@paradym/wallet-sdk/dcApi/ParadymDcApiSdk'
import { hasMissingCards } from '@paradym/wallet-sdk/display/common'
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
  ParadymWalletNoStoreError,
} from '@paradym/wallet-sdk/error'
import type { FormattedSubmissionEntrySatisfied } from '@paradym/wallet-sdk/format/submission'
import { ParadymWalletPasoError } from '@paradym/wallet-sdk/paso/error'
import { pasoPaymentTransactionDataType } from '@paradym/wallet-sdk/paso/paymentRulebook'
import { getIsBiometricsEnabled } from '@paradym/wallet-sdk/storage/sharedMmkv'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type NativeSyntheticEvent, Platform, type TextLayoutEventData, useColorScheme } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'
import { CardRow } from '../share/components/CardRow'
import { CardSelectionList, SwitchCardRow } from '../share/components/CardSelectionList'
import { PaymentTransactionDetails } from '../share/components/PaymentTransactionDetails'
import { resolvePasoAuthenticationMethods } from '../share/pasoAuthenticationMethods'
import { usePasoRefusalMessage } from '../share/pasoRefusalMessage'
import { useTransactionDataSeen } from '../share/useTransactionDataSeen'
import { DcApiRequestedCards } from './components/DcApiRequestedCards'
import { DcApiVerifierSection } from './components/DcApiVerifierSection'
import { dcApiCardArtwork } from './components/dcApiCardArtwork'
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
  // enabled. `description` is the sentence the user sees: that the request could not be read at
  // all, that the card could not be sent after it was approved, or what to do about it when the
  // user can do something.
  | { name: 'failed'; description: string; reason: string }

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
      <TamaguiProvider defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'} config={tamaguiConfig}>
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
  // The requested card whose matching cards are listed in place of the review, to pick another one.
  const [switchingEntry, setSwitchingEntry] = useState<FormattedSubmissionEntrySatisfied>()
  // Picking a card resolves the review again, a payment included, so sharing waits for it.
  const [isSelecting, setIsSelecting] = useState(false)
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const biometricsType = useBiometricsType()
  const pasoRefusalMessage = usePasoRefusalMessage()
  const { hasSeenTransactionData, onTransactionDataLayout, onViewportLayout, onScroll } = useTransactionDataSeen()

  // How the wallet was opened for this request, which PaSO reports as how the payment was released.
  const unlockMethodRef = useRef<UnlockMethod | undefined>(undefined)

  // The SDK holds the askar store open, so it outlives the phase it was created in.
  const sdkRef = useRef<ParadymDcApiSdk | undefined>(undefined)
  useEffect(() => () => void sdkRef.current?.shutdown(), [])

  // One unlock at a time, and only until one succeeds: a second one would open a second askar store
  // and overwrite the ref with it, leaving the first handle open until the process goes down. The
  // phase cannot carry this — it is only current on the next render, and both calls can have
  // started before that.
  const isUnlockingRef = useRef(false)

  // Through the review, so the declined request lands in the activity log before the UI goes down.
  const decline = useCallback((review: DcApiReview) => review.decline(t(messages.declined)), [t])

  const unlock = useCallback(
    async (method: UnlockMethod, getKey: (version: number) => Promise<string | null>) => {
      if (isUnlockingRef.current) return
      isUnlockingRef.current = true

      setError(undefined)
      setPhase({ name: 'opening', method })

      let sdk: ParadymDcApiSdk
      // Opening the wallet. Everything that fails here is something the user can answer for — a
      // wrong pin, a dismissed biometric prompt — so it goes back to the pad to be tried again.
      try {
        const { getWalletKeyVersion } = await walletKeyVersion()
        const key = await getKey(getWalletKeyVersion())
        if (!key) {
          isUnlockingRef.current = false
          setPhase({ name: 'unlock' })
          setError(t(messages.biometricsUnavailable))
          return
        }

        // The app's own configuration and logging: the request UI has to trust exactly what the app
        // trusts, down to the `getTrustedCertificatesForVerification` callback.
        const [{ ParadymDcApiSdk }, { paradymWalletSdkOptions, getLoggingOptions }] = await Promise.all([
          dcApiSdk(),
          paradymConfiguration(),
        ])
        sdk = await ParadymDcApiSdk.initialize({
          ...paradymWalletSdkOptions,
          logging: getLoggingOptions(isDevelopmentModeEnabled),
          walletKey: key,
          locale: i18n.locale,
        })
        sdkRef.current = sdk
        unlockMethodRef.current = method
      } catch (unlockError) {
        isUnlockingRef.current = false
        setPhase({ name: 'unlock' })
        console.error('Error unlocking wallet', unlockError)
        pinRef.current?.clear()
        // A wrong pin shakes the dots, as on the app's lock screen, rather than showing a message.
        if (unlockError instanceof ParadymWalletAuthenticationInvalidPinError) {
          pinRef.current?.shake()
          return
        }
        // A cancelled biometric prompt is the user choosing the pin pad, not a failure.
        if (!(unlockError instanceof ParadymWalletBiometricAuthenticationCancelledError)) {
          setError(unlockMessage(unlockError, t))
        }
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
        // A PaSO refusal is a decision the spec asks the wallet to explain, not a failure.
        setPhase({
          name: 'failed',
          description:
            reviewError instanceof ParadymWalletPasoError
              ? pasoRefusalMessage(reviewError.code)
              : t(messages.requestFailed),
          reason: message(reviewError),
        })
      }
    },
    [request, t, isDevelopmentModeEnabled, pasoRefusalMessage]
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

  const select = useCallback(
    async (review: DcApiReview, inputDescriptorId: string, credentialRecordId: string) => {
      setError(undefined)
      setIsSelecting(true)

      try {
        setPhase({ name: 'review', review: await review.select(inputDescriptorId, credentialRecordId) })
      } catch (selectError) {
        console.error('Error selecting card', selectError)
        // The card's payment could not be resolved: a PaSO refusal the user is told about, as when
        // reviewing the request.
        setPhase({
          name: 'failed',
          description:
            selectError instanceof ParadymWalletPasoError
              ? pasoRefusalMessage(selectError.code)
              : t(messages.requestFailed),
          reason: message(selectError),
        })
      } finally {
        setIsSelecting(false)
      }
    },
    [t, pasoRefusalMessage]
  )

  const share = useCallback(
    async (review: DcApiReview) => {
      setError(undefined)
      setPhase({ name: 'sharing', review })

      try {
        await review.share(getShareOptions(review, unlockMethodRef.current))
      } catch (shareError) {
        console.error('Error sharing credentials', shareError)
        // A dismissed biometric prompt sent nothing, so the request is still open: back to the
        // review, where sharing prompts again.
        if (shareError instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          setPhase({ name: 'review', review })
          setError(t(commonMessages.biometricAuthenticationCancelled))
          return
        }

        // On iOS `approve()` has already released the request by the time most failures happen, so
        // there is nothing to retry. The request is declined from the failure screen rather than
        // here: declining takes the UI down with it, and the user would never see what went wrong.
        setPhase({
          name: 'failed',
          description: t(
            shareError instanceof ParadymWalletBiometricAuthenticationNotEnabledError
              ? commonMessages.biometricAuthenticationMustBeEnabledInSettings
              : messages.shareFailed
          ),
          reason: message(shareError),
        })
      }
    },
    [t]
  )

  return (
    <YStack
      // On iOS the system sheet is the whole surface, so the screen fills it instead of drawing a
      // second one inside it. See `drawsOwnSheet`.
      flex-1={!drawsOwnSheet}
      borderTopLeftRadius={drawsOwnSheet ? '8' : undefined}
      borderTopRightRadius={drawsOwnSheet ? '8' : undefined}
      backgroundColor="background"
      gap="5"
      pt="6"
      px="5"
      paddingBottom={insets.bottom || '8'}
      // The Android sheet sits on top of the verifier's app, so it can never take the whole screen:
      // the request keeps its own height and the review scrolls inside it.
      maxHeight={drawsOwnSheet ? '85%' : undefined}
    >
      {/* A full-height sheet gets the app's own unlock screen: the lock, the heading and the origin
          just above the middle, the dots under them, rather than a left-aligned heading with the screen empty under
          it. The Android sheet is only as tall as its content, so it keeps the compact heading. */}
      {isUnlocking(phase) && !drawsOwnSheet ? (
        // Takes the top half while the pad is on screen, and the whole sheet once it is not: unlocking through biometrics has no pad, so the same block bottom-aligned
        // would hug the bottom of an otherwise empty screen.
        <YStack flex-1 alignItems="center" justifyContent={showsPinPad(phase) ? 'flex-end' : 'center'} gap="5">
          <IconContainer h="11" w="11" items="center" justify="center" icon={<HeroIcons.LockClosedFilled />} />
          <YStack gap="2" alignItems="center">
            <Heading heading="h2" fontWeight="semiBold" textAlign="center">
              {t(messages.unlockTitle)}
            </Heading>
            <BalancedParagraph
              key={t(messages.unlockSubtitle(request.origin || t(commonMessages.unknownOrganization)))}
              variant="annotation"
              textAlign="center"
            >
              {t(messages.unlockSubtitle(request.origin || t(commonMessages.unknownOrganization)))}
            </BalancedParagraph>
          </YStack>
          {phase.name === 'opening' && !showsPinPad(phase) ? (
            <Stack pt="2">
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

      {(phase.name === 'review' || phase.name === 'sharing') && switchingEntry ? (
        // A sheet has no room for a second one, so the cards to pick from take the review's place.
        <ScrollView
          flexShrink={1}
          flexGrow={drawsOwnSheet ? 0 : 1}
          contentContainerStyle={{ paddingBottom: '2' }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <CardSelectionList
            title={
              switchingEntry.inputDescriptorId === getPayment(phase.review)?.cardForTransactionId
                ? t({
                    id: 'paso.payment.chooseCardTitle',
                    message: 'Choose a payment card',
                    comment: 'Title of the sheet where the user picks the card to authorize a payment with',
                  })
                : t(commonMessages.chooseCardTitle)
            }
            cards={switchingEntry.credentials}
            selectedCardId={switchingEntry.credentials[0].credential.record.id}
            onSelect={(credentialRecordId) =>
              select(phase.review, switchingEntry.inputDescriptorId, credentialRecordId)
            }
            onClose={() => setSwitchingEntry(undefined)}
            artwork={dcApiCardArtwork}
          />
        </ScrollView>
      ) : phase.name === 'review' || phase.name === 'sharing' ? (
        <ScrollView
          // Shrinks into whatever the sheet's max height leaves it, which is what makes it scroll
          // rather than push the buttons off the screen. On a full-height sheet it grows into the
          // space instead, so the buttons stay at the bottom of the screen.
          flexShrink={1}
          flexGrow={drawsOwnSheet ? 0 : 1}
          contentContainerStyle={{ gap: '5', paddingBottom: '2' }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onLayout={onViewportLayout}
          onScroll={onScroll}
          scrollEventThrottle={48}
        >
          <DcApiVerifierSection
            verifier={phase.review.verifier}
            origin={request.origin}
            isPayment={getPayment(phase.review) !== undefined}
          />
          {getPayment(phase.review) ? (
            <PaymentTransactionDetails
              transaction={getPayment(phase.review) as NonNullable<ReturnType<typeof getPayment>>}
              onLayout={onTransactionDataLayout}
              compact
            >
              {/* The card that pays, in the payment's own box rather than among the requested cards. */}
              {getPaymentEntry(phase.review) ? (
                <YStack gap="3">
                  {(getPaymentEntry(phase.review)?.credentials.length ?? 0) > 1 ? (
                    <SwitchCardRow
                      count={getPaymentEntry(phase.review)?.credentials.length ?? 0}
                      onPress={() => setSwitchingEntry(getPaymentEntry(phase.review))}
                      disabled={phase.name === 'sharing' || isSelecting}
                    />
                  ) : null}
                  <CardRow
                    card={getPaymentCard(phase.review) as NonNullable<ReturnType<typeof getPaymentCard>>}
                    artwork={dcApiCardArtwork(getPaymentCard(phase.review)?.credential.display.svg)}
                  />
                </YStack>
              ) : null}
            </PaymentTransactionDetails>
          ) : null}
          {getOtherEntries(phase.review).length > 0 ? (
            <DcApiRequestedCards
              submission={{ ...phase.review.submission, entries: getOtherEntries(phase.review) }}
              onSwitch={setSwitchingEntry}
              isSwitchDisabled={phase.name === 'sharing' || isSelecting}
            />
          ) : null}
        </ScrollView>
      ) : null}

      {phase.name === 'failed' ? (
        <ScrollView
          flexShrink={1}
          flexGrow={drawsOwnSheet ? 0 : 1}
          contentContainerStyle={{ gap: '5' }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Heading>{t(commonMessages.somethingWentWrong)}</Heading>
          <Stack alignSelf="flex-start">
            <XStack p="5" bg="grey-100" borderRadius="4">
              <HeroIcons.NoSymbol color="grey-800" size={32} />
            </XStack>
          </Stack>
          <Paragraph>{phase.description}</Paragraph>

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

      {error ? <Paragraph color="danger-500">{error}</Paragraph> : null}

      {switchingEntry && (phase.name === 'review' || phase.name === 'sharing') ? null : showsPinPad(phase) ? (
        // Kept mounted across the phase change: `isLoading` fills the dots and animates them while
        // the wallet opens, which is the app's own lock screen, and it ignores taps meanwhile. On a
        // full-height sheet it takes half the screen, as there: the dots right under the heading,
        // 32pt from it, and the pad at the bottom.
        <Stack flex-1={!drawsOwnSheet} pt={drawsOwnSheet ? '5' : '3'}>
          <PinDotsInput
            ref={pinRef}
            pinLength={6}
            isLoading={phase.name === 'opening'}
            onPinComplete={unlockUsingPin}
            onBiometricsTap={getIsBiometricsEnabled() ? unlockUsingBiometrics : undefined}
            useNativeKeyboard={false}
            biometricsType={biometricsType}
          />
        </Stack>
      ) : phase.name === 'opening' ? (
        // The full-height sheet centres its own spinner with the heading above; this is the compact
        // sheet's, where the pad would be, so the heading does not jump as the phase changes.
        drawsOwnSheet ? (
          <Stack alignItems="center" py="8">
            <Spinner />
          </Stack>
        ) : null
      ) : phase.name === 'failed' ? (
        // Closing is what declines: the request is still open until then, and the verifier is told
        // why rather than being left to time out.
        <Stack borderTopWidth="1" borderColor="grey-200" mx="-5" px="5" pt="5">
          <Button.Solid onPress={() => request.decline(phase.reason)}>{t(commonMessages.close)}</Button.Solid>
        </Stack>
      ) : phase.name === 'review' && !canShare(phase.review) ? (
        // Nothing the wallet holds answers the request, so declining is all there is to do — the
        // same as the app's own share screen, rather than a share button that can never be pressed.
        <YStack gap="3" borderTopWidth="1" borderColor="grey-200" mx="-5" px="5" pt="5">
          <Paragraph variant="sub" fontWeight="medium" text="center" color="danger-500">
            {t(
              phase.review.submission.entries.length === 0 || hasMissingCards(phase.review.submission)
                ? commonMessages.missingCardsWarning
                : getUnmetAttributeMessages(phase.review.submission).warning
            )}
          </Paragraph>
          <Button.Solid onPress={() => phase.review.decline(missingCredentialsReason)}>
            {t(commonMessages.close)}
          </Button.Solid>
        </YStack>
      ) : phase.name === 'review' || phase.name === 'sharing' ? (
        <YStack gap="2" borderTopWidth="1" borderColor="grey-200" mx="-5" px="5" pt="5">
          <XStack gap="2">
            {/* Both are disabled while the response is being built: it cannot be taken back once
                `approve()` has released the request, so there is nothing a second press could do. */}
            <Button.Outline grow={1} disabled={phase.name === 'sharing'} onPress={() => decline(phase.review)}>
              {pasoLabels(phase.review)?.denialActionLabel ?? t(commonMessages.declineButton)}
            </Button.Outline>
            <Button.Solid
              grow={1}
              // A payment has to have been on screen before it can be authorized, as in the app.
              disabled={
                phase.name === 'sharing' ||
                isSelecting ||
                (getPayment(phase.review) !== undefined && !hasSeenTransactionData)
              }
              onPress={() => share(phase.review)}
            >
              {phase.name === 'sharing' ? (
                <Spinner variant="dark" />
              ) : getPayment(phase.review) ? (
                (pasoLabels(phase.review)?.affirmativeActionLabel ??
                t({
                  id: 'paso.payment.accept',
                  message: 'Pay',
                  comment: 'Fallback label for the button that authorizes a PaSO payment',
                }))
              ) : (
                t(messages.share)
              )}
            </Button.Solid>
          </XStack>
          {getPayment(phase.review) && !hasSeenTransactionData ? (
            <Paragraph variant="annotation" text="center">
              <Trans
                id="paso.payment.scrollToConfirm"
                comment="Shown while the user has not yet scrolled through all payment details"
              >
                Scroll down to review all payment details.
              </Trans>
            </Paragraph>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  )
}

/**
 * A paragraph that, once it wraps onto two lines, narrows to make them about the same length, as CSS
 * `text-wrap: balance` does: React Native has no such option. Keyed on its text, since it measures once.
 */
function BalancedParagraph({ children, ...props }: Omit<ParagraphProps, 'children'> & { children: string }) {
  // Undefined while the natural wrap is measured, null when that wrap is kept.
  const [maxWidth, setMaxWidth] = useState<number | null>()

  const onTextLayout = ({ nativeEvent: { lines } }: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (maxWidth === undefined) {
      setMaxWidth(lines.length === 2 ? balancedWidth(children, lines[0].width + lines[1].width) : null)
    } else if (maxWidth !== null && lines.length > 2) {
      // The estimate came out too narrow for the words to fit on two lines.
      setMaxWidth(null)
    }
  }

  return (
    // Tamagui forwards `onTextLayout` on native but leaves it out of its types.
    <Paragraph {...props} {...({ onTextLayout } as object)} maxWidth={maxWidth ?? undefined}>
      {children}
    </Paragraph>
  )
}

/** The width of the longer line when `text`, `width` wide on one line, is split where the lines are most even. */
function balancedWidth(text: string, width: number) {
  const words = text.split(' ')
  let longest = text.length
  for (let i = 1; i < words.length; i++) {
    longest = Math.min(longest, Math.max(words.slice(0, i).join(' ').length, words.slice(i).join(' ').length))
  }
  // Characters stand in for widths, so a little slack keeps the estimate from forcing a third line.
  return Math.ceil(((longest + 2) * width) / text.length)
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

/** The payment the request asks the user to authorize, if it is one. */
function getPayment(review: DcApiReview) {
  const transaction = review.transactionData
  return transaction?.type === pasoPaymentTransactionDataType ||
    transaction?.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1'
    ? transaction
    : undefined
}

/** The requested card the payment is authorized with, when the wallet holds one. */
function getPaymentEntry(review: DcApiReview) {
  const payment = getPayment(review)
  return review.submission.entries.find(
    (entry): entry is FormattedSubmissionEntrySatisfied =>
      entry.inputDescriptorId === payment?.cardForTransactionId && entry.isSatisfied
  )
}

/** The card the payment is authorized with, when the wallet holds one. */
function getPaymentCard(review: DcApiReview) {
  return getPaymentEntry(review)?.credentials[0]
}

/**
 * The requested cards apart from the payment card, which has its own section. Without a card for the
 * payment its entry stays, to say which card is missing.
 */
function getOtherEntries(review: DcApiReview) {
  const paymentCard = getPaymentCard(review)
  return review.submission.entries.filter(
    (entry) => !paymentCard || entry.inputDescriptorId !== getPayment(review)?.cardForTransactionId
  )
}

/** The issuer's button labels for a PaSO payment, which [PaSO View] Section 2 has the wallet use. */
function pasoLabels(review: DcApiReview) {
  return review.transactionData?.type === pasoPaymentTransactionDataType ? review.transactionData : undefined
}

/**
 * How the user released a PaSO payment, for its `urn:paso:risk:global:amr:1` risk signal. The pin
 * opened the wallet for this request alone, so it counts as entered for this transaction; see
 * `resolvePasoAuthenticationMethods` for the rest.
 */
function getShareOptions(review: DcApiReview, unlockMethod: UnlockMethod | undefined): DcApiShareOptions | undefined {
  const transaction = review.transactionData
  if (transaction?.type !== pasoPaymentTransactionDataType) return undefined

  const cardMetadata = review.submission.entries.find(
    (entry): entry is typeof entry & { isSatisfied: true } =>
      entry.inputDescriptorId === transaction.cardForTransactionId && entry.isSatisfied
  )?.credentials[0]?.credential.metadata
  const usedHardwareBoundKey = isHardwareBoundCredentialType([
    cardMetadata?.type,
    ...(cardMetadata?.additionalTypes ?? []),
  ])

  return {
    authenticationMethods: resolvePasoAuthenticationMethods({
      usedTransactionPin: unlockMethod === 'pin',
      usedHardwareBoundKey,
    }),
    authenticatedAt: new Date(),
  }
}

/** Every requested card has to have a credential behind it before anything can be shared. */
function canShare(review: DcApiReview) {
  return review.submission.entries.length > 0 && review.submission.areAllSatisfied
}

/** The decline reason passed to the OS when the wallet cannot answer the request. For logs only. */
const missingCredentialsReason = 'The wallet does not hold credentials that answer the request'

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The message for an unlock failure other than a wrong pin, which shakes the dots instead. Anything
 * but a missing wallet is shown as it came, since there is nothing better to say about it.
 */
function unlockMessage(error: unknown, t: ReturnType<typeof useLingui>['t']) {
  if (error instanceof ParadymWalletNoStoreError) return t(messages.openWalletFirst)

  return message(error)
}
