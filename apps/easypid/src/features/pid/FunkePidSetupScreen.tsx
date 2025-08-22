import { sendCommand } from '@animo-id/expo-ausweis-sdk'
import { type SdJwtVcHeader, SdJwtVcRecord } from '@credo-ts/core'
import { InvalidPinError } from '@easypid/crypto/error'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { ReceivePidUseCaseCFlow } from '@easypid/use-cases/ReceivePidUseCaseCFlow'
import type {
  CardScanningErrorDetails,
  ReceivePidUseCaseFlowOptions,
  ReceivePidUseCaseState,
} from '@easypid/use-cases/ReceivePidUseCaseFlow'
import type { PidSdJwtVcAttributes } from '@easypid/utils/pidCustomMetadata'
import { type CardScanningState, SIMULATOR_PIN, getPidSetupSlideContent } from '@easypid/utils/sharedPidSetup'
import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { SlideWizard, type SlideWizardRef, usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { capitalizeFirstLetter, getHostNameFromUrl, sleep } from '@package/utils'
import { getCredentialForDisplay, getCredentialForDisplayId } from '@paradym/wallet-sdk/display/credential'
import {
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
} from '@paradym/wallet-sdk/error'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import { addReceivedActivity } from '@paradym/wallet-sdk/storage/activities'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUseCloudHsm } from '../onboarding/useShouldUseCloudHsm'
import { PidCardScanSlide } from './PidCardScanSlide'
import { PidIdCardFetchSlide } from './PidEidCardFetchSlide'
import { PidEidCardPinSlide } from './PidEidCardPinSlide'
import { PidIdCardVerifySlide } from './PidEidCardVerifySlide'
import { PidReviewRequestSlide } from './PidReviewRequestSlide'
import { PidSetupStartSlide } from './PidSetupStartSlide'
import { PidWalletPinSlide } from './PidWalletPinSlide'

const walletNotLockedMessage = defineMessage({ id: 'pidSetup.walletNotUnlocked', message: 'Wallet not unlocked' })
const notReadyToReceivePidMessage = defineMessage({
  id: 'pidSetup.notReadyToReceivePid',
  message: 'Not ready to receive PID',
})

export function FunkePidSetupScreen() {
  const paradym = useParadym('unlocked')

  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const hasEidCardFeatureFlag = useFeatureFlag('EID_CARD')

  const [idCardPin, setIdCardPin] = useState<string>()
  const [receivePidUseCase, setReceivePidUseCase] = useState<ReceivePidUseCaseCFlow>()
  const [receivePidUseCaseState, setReceivePidUseCaseState] = useState<ReceivePidUseCaseState | 'initializing'>()
  const [idCardScanningState, setIdCardScanningState] = useState<CardScanningState>({
    isCardAttached: undefined,
    progress: 0,
    state: 'readyToScan',
    showScanModal: true,
  })
  const { t } = useLingui()
  const [eidCardRequestedAccessRights, setEidCardRequestedAccessRights] = useState<string[]>([])
  const [onIdCardPinReEnter, setOnIdCardPinReEnter] = useState<(idCardPin: string) => Promise<void>>()
  const [userName, setUserName] = useState<string>()
  const [isScanning, setIsScanning] = useState(false)
  const [allowSimulatorCard, setAllowSimulatorCard] = useState(false)
  const [shouldUseCloudHsm, setShouldUseCloudHsm] = useShouldUseCloudHsm()
  const slideWizardRef = useRef<SlideWizardRef>(null)

  if (!hasEidCardFeatureFlag) {
    toast.show(t(commonMessages.featureNotSupported), { customData: { preset: 'warning' } })
    pushToWallet()
    return
  }

  const onEnterPin: ReceivePidUseCaseFlowOptions['onEnterPin'] = useCallback(
    async (_options) => {
      // If we have a PIN, use it once and clear it
      if (idCardPin) {
        const pin = idCardPin
        setIdCardPin(undefined)
        return pin
      }

      // Hide NFC modal on iOS
      if (Platform.OS === 'ios') {
        sendCommand({ cmd: 'INTERRUPT' })
      }

      // Show error state
      setIdCardScanningState((state) => ({
        ...state,
        progress: 0,
        state: 'error',
        showScanModal: true,
        isCardAttached: undefined,
      }))

      // Wait for modal animations
      await sleep(Platform.OS === 'ios' ? 3000 : 1000)

      // Reset scanning state
      if (Platform.OS === 'android') {
        setIdCardScanningState((state) => ({
          ...state,
          state: 'readyToScan',
          showScanModal: false,
        }))
        await sleep(500)
      }

      // Show error message
      pushToWallet()
      toast.show(t({ id: 'pidSetup.invalidEidPin', message: 'Invalid eID card PIN entered' }), {
        customData: { preset: 'danger' },
      })

      // Return new promise for PIN re-entry
      return new Promise<string>((resolve) => {
        setOnIdCardPinReEnter(() => async (newPin: string) => {
          setIdCardScanningState((state) => ({ ...state, showScanModal: true }))
          setIsScanning(true)
          setOnIdCardPinReEnter(undefined)

          // Small delay to allow UI updates
          await sleep(100)
          resolve(newPin)
        })
      })
    },
    [idCardPin, toast.show, pushToWallet, t]
  )

  // Bit unfortunate, but we need to keep it as ref, as otherwise the value passed to ReceivePidUseCase.initialize will not get updated and we
  // don't have access to the pin. We should probably change this to something like useCase.setPin() and then .continue
  const onEnterPinRef = useRef({ onEnterPin })
  useEffect(() => {
    onEnterPinRef.current.onEnterPin = onEnterPin
  }, [onEnterPin])

  const onIdCardStart = async ({
    walletPin,
    allowSimulatorCard,
  }: { walletPin: string; allowSimulatorCard: boolean }) => {
    if (paradym.state !== 'unlocked') {
      toast.show(t(walletNotLockedMessage), {
        customData: { preset: 'danger' },
      })
      pushToWallet()
      return
    }

    if (!walletPin) {
      toast.show(t({ id: 'pidSetup.walletPinMissing', message: 'Wallet PIN is missing' }), {
        customData: { preset: 'danger' },
      })
      pushToWallet()
      return
    }

    const baseOptions = {
      paradym: paradym.paradym,
      onStateChange: setReceivePidUseCaseState,
      onCardAttachedChanged: ({ isCardAttached }) =>
        setIdCardScanningState((state) => ({
          ...state,
          isCardAttached,
          state: state.state === 'readyToScan' && isCardAttached ? 'scanning' : state.state,
        })),
      onStatusProgress: ({ progress }) => setIdCardScanningState((state) => ({ ...state, progress })),
      onEnterPin: (options) => onEnterPinRef.current.onEnterPin(options),
      allowSimulatorCard,
    } as const satisfies ReceivePidUseCaseFlowOptions

    if (!receivePidUseCase && receivePidUseCaseState !== 'initializing') {
      // Flow is always 'c' flow for now.
      const flow = ReceivePidUseCaseCFlow.initialize(baseOptions)

      return flow
        .then(async ({ accessRights, authFlow }) => {
          setReceivePidUseCase(authFlow)
          setEidCardRequestedAccessRights(accessRights)
        })
        .catch(async (e) => {
          toast.show(e.message, { customData: { preset: 'danger' } })
          pushToWallet()
        })
    }
  }

  const onWalletPinEnter = async (pin: string) => {
    // If pin is simulator pin we require the user to retry so that second time
    // they can set the real pin
    const isSimulatorPinCode = pin === SIMULATOR_PIN
    if (isSimulatorPinCode && !allowSimulatorCard) {
      toast.show(t(commonMessages.simulatorEidCardActivated), {
        message: t({
          id: 'simulatorEidCard.enterRealPin',
          message: 'Enter your real PIN to continue',
        }),
        customData: {
          preset: 'success',
        },
      })
      setAllowSimulatorCard(true)
      throw new Error('Retry')
    }

    if (shouldUseCloudHsm) {
      try {
        await setWalletServiceProviderPin(pin.split('').map(Number))
      } catch (e) {
        if (e instanceof InvalidPinError) {
          toast.show(e.message, {
            customData: {
              preset: 'danger',
            },
          })
        }
        throw e
      }
    }
    await onIdCardStart({ walletPin: pin, allowSimulatorCard: allowSimulatorCard })
  }

  const onStart = (shouldUseCloudHsm: boolean) => setShouldUseCloudHsm(shouldUseCloudHsm)

  const onIdCardPinEnter = (pin: string) => setIdCardPin(pin)
  const onCancel = useCallback(() => {
    // We just want to make sure to cancel, don't care about the result
    void receivePidUseCase?.cancelIdCardScanning().catch(() => {})

    pushToWallet()
  }, [receivePidUseCase, pushToWallet])

  const onStartScanning = async () => {
    if (receivePidUseCase?.state !== 'id-card-auth') {
      toast.show(t(notReadyToReceivePidMessage), { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (paradym.state !== 'unlocked') {
      toast.show(t(walletNotLockedMessage), { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    setIsScanning(true)

    // Authenticate
    try {
      await receivePidUseCase.authenticateUsingIdCard()
    } catch (error) {
      setIdCardScanningState((state) => ({
        ...state,
        state: 'error',
      }))
      await sleep(500)
      setIdCardScanningState((state) => ({
        ...state,
        showScanModal: false,
      }))
      await sleep(500)

      const reason = (error as CardScanningErrorDetails).reason
      if (reason === 'user_cancelled' || reason === 'cancelled') {
        toast.show(t({ id: 'pidSetup.eidScanningCancelled', message: 'eID card scanning cancelled' }), {
          customData: {
            preset: 'danger',
          },
        })
        setIsScanning(false)
        pushToWallet()
      } else {
        toast.show(t(commonMessages.somethingWentWrong), {
          message: t(commonMessages.pleaseTryAgain),
          customData: {
            preset: 'danger',
          },
        })
        pushToWallet()
        setIsScanning(false)
      }

      return
    }

    try {
      setIdCardScanningState((state) => ({
        ...state,
        state: 'complete',
        progress: 100,
      }))

      // on iOS it takes around two seconds for the modal to close. On Android we wait 1 second
      // and then close the modal
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIdCardScanningState((state) => ({ ...state, showScanModal: false }))
      await new Promise((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 500 : 1000))

      // Acquire access token
      await receivePidUseCase.acquireAccessToken()

      slideWizardRef.current?.goToNextSlide()
      // If not using cloud hsm we first want approval from the user
      if (shouldUseCloudHsm) {
        await retrieveCredential()
      }
    } catch (error) {
      toast.show(t(commonMessages.somethingWentWrong), {
        customData: {
          preset: 'danger',
        },
      })
      pushToWallet()
    }
  }

  const retrieveCredential = async () => {
    if (receivePidUseCase?.state !== 'retrieve-credential') {
      toast.show(t(notReadyToReceivePidMessage), { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (paradym.state !== 'unlocked') {
      toast.show(t(walletNotLockedMessage), { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    try {
      // Retrieve Credential
      const credentials = await receivePidUseCase.retrieveCredentials()

      for (const credential of credentials) {
        if (credential instanceof SdJwtVcRecord) {
          const parsed = paradym.paradym.agent.sdJwtVc.fromCompact<SdJwtVcHeader, PidSdJwtVcAttributes>(
            credential.compactSdJwtVc
          )
          setUserName(
            `${capitalizeFirstLetter(parsed.prettyClaims.given_name.toLowerCase())} ${capitalizeFirstLetter(
              parsed.prettyClaims.family_name.toLowerCase()
            )}`
          )

          const { display } = getCredentialForDisplay(credential)
          await addReceivedActivity(paradym.paradym, {
            // TODO: should host be entityId or the iss?
            entityId: receivePidUseCase.resolvedCredentialOffer.credentialOfferPayload.credential_issuer,
            host: getHostNameFromUrl(parsed.prettyClaims.iss) as string,
            name: display.issuer.name,
            logo: display.issuer.logo,
            backgroundColor: '#ffffff', // PID Logo needs white background
            credentialIds: [getCredentialForDisplayId(credential)],
          })
        }
      }
    } catch (error) {
      if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        toast.show(t(commonMessages.biometricAuthenticationCancelled), {})
        return
      }

      // TODO: What if not supported?
      if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
        toast.show(t(commonMessages.biometricAuthenticationNotEnabled), {})
        pushToWallet()
        return
      }

      toast.show(t(commonMessages.somethingWentWrong), { customData: { preset: 'danger' } })
      pushToWallet()
    }
  }

  return (
    <SlideWizard
      ref={slideWizardRef}
      steps={[
        {
          step: 'id-card-start',
          progress: 20,
          screen: <PidSetupStartSlide {...getPidSetupSlideContent('data-protection', t)} onStart={onStart} />,
        },
        {
          step: 'id-card-pin',
          progress: 30,
          screen: (
            <PidWalletPinSlide
              title={t(commonMessages.enterPin)}
              subtitle={t({
                id: 'pidSetup.enterPinSubtitle',
                message: 'Enter the PIN code you use to unlock your wallet.',
              })}
              onEnterPin={onWalletPinEnter}
            />
          ),
        },
        {
          step: 'id-card-requested-attributes',
          progress: 40,
          backIsCancel: true,
          screen: (
            <PidReviewRequestSlide
              {...getPidSetupSlideContent('id-card-requested-attributes', t)}
              requestedAttributes={eidCardRequestedAccessRights}
            />
          ),
        },
        {
          step: 'id-card-pin',
          progress: 50,
          backIsCancel: true,
          screen: (
            <PidEidCardPinSlide
              {...getPidSetupSlideContent('id-card-pin', t)}
              onEnterPin={onIdCardPinReEnter ?? onIdCardPinEnter}
            />
          ),
        },
        {
          step: 'id-card-start-scan',
          progress: 60,
          backIsCancel: true,
          screen: (
            <PidCardScanSlide
              {...getPidSetupSlideContent('id-card-start-scan', t)}
              progress={idCardScanningState.progress}
              scanningState={idCardScanningState.state}
              isCardAttached={idCardScanningState.isCardAttached}
              onCancel={() => {
                receivePidUseCase?.cancelIdCardScanning()
                setIsScanning(false)
              }}
              showScanModal={!isScanning ? false : idCardScanningState.showScanModal ?? true}
              onStartScanning={!isScanning ? onStartScanning : undefined}
            />
          ),
        },
        !shouldUseCloudHsm
          ? {
              step: 'id-card-verify',
              progress: 80,
              backIsCancel: true,
              screen: (
                <PidIdCardVerifySlide
                  {...getPidSetupSlideContent('id-card-verify', t)}
                  onVerifyWithBiometrics={retrieveCredential}
                />
              ),
            }
          : undefined,
        {
          step: 'id-card-fetch',
          progress: 90,
          backIsCancel: true,
          screen: (
            <PidIdCardFetchSlide
              {...getPidSetupSlideContent(userName ? 'id-card-complete' : 'id-card-fetch', t)}
              userName={userName}
              onComplete={() => pushToWallet('replace')}
            />
          ),
        },
      ].filter((s): s is NonNullable<typeof s> => s !== undefined)}
      confirmation={{
        title: t({
          id: 'pidSetup.stopTitle',
          message: 'Stop ID Setup?',
        }),
        description: t({
          id: 'pidSetup.stopDescription',
          message: 'If you stop, you can still do the setup later.',
        }),
      }}
      onCancel={onCancel}
    />
  )
}
