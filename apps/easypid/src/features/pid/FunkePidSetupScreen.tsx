import { sendCommand } from '@animo-id/expo-ausweis-sdk'
import { type SdJwtVcHeader, SdJwtVcRecord } from '@credo-ts/core'
import { useSecureUnlock } from '@easypid/agent'
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
import {
  BiometricAuthenticationCancelledError,
  BiometricAuthenticationNotEnabledError,
  getCredentialForDisplay,
  getCredentialForDisplayId,
} from '@package/agent'
import { SlideWizard, type SlideWizardRef, usePushToWallet } from '@package/app'
import { useToastController } from '@package/ui'
import { capitalizeFirstLetter, getHostNameFromUrl, sleep } from '@package/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { addReceivedActivity } from '../activity/activityRecord'
import { useShouldUseCloudHsm } from '../onboarding/useShouldUseCloudHsm'
import { PidCardScanSlide } from './PidCardScanSlide'
import { PidIdCardFetchSlide } from './PidEidCardFetchSlide'
import { PidEidCardPinSlide } from './PidEidCardPinSlide'
import { PidIdCardVerifySlide } from './PidEidCardVerifySlide'
import { PidReviewRequestSlide } from './PidReviewRequestSlide'
import { PidSetupStartSlide } from './PidSetupStartSlide'
import { PidWalletPinSlide } from './PidWalletPinSlide'

export function FunkePidSetupScreen() {
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const secureUnlock = useSecureUnlock()
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
  const [eidCardRequestedAccessRights, setEidCardRequestedAccessRights] = useState<string[]>([])
  const [onIdCardPinReEnter, setOnIdCardPinReEnter] = useState<(idCardPin: string) => Promise<void>>()
  const [userName, setUserName] = useState<string>()
  const [isScanning, setIsScanning] = useState(false)
  const [allowSimulatorCard, setAllowSimulatorCard] = useState(false)
  const [shouldUseCloudHsm, setShouldUseCloudHsm] = useShouldUseCloudHsm()
  const slideWizardRef = useRef<SlideWizardRef>(null)

  if (!hasEidCardFeatureFlag) {
    toast.show('This feature is not supported in this version of the app.', { customData: { preset: 'warning' } })
    pushToWallet()
    return
  }

  const onEnterPin: ReceivePidUseCaseFlowOptions['onEnterPin'] = useCallback(
    async (options) => {
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
      toast.show('Invalid eID card PIN entered', {
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
    [idCardPin, toast.show, pushToWallet]
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
    if (secureUnlock.state !== 'unlocked') {
      toast.show('Wallet not unlocked', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (!walletPin) {
      toast.show('Wallet PIN is missing', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    const baseOptions = {
      agent: secureUnlock.context.agent,
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
      toast.show('Simulator eID card activated', {
        message: 'Enter your real PIN to continue',
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
      toast.show('Not ready to receive PID', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (secureUnlock.state !== 'unlocked') {
      toast.show('Wallet not unlocked', { customData: { preset: 'danger' } })
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
        toast.show('Card scanning cancelled', {
          customData: {
            preset: 'danger',
          },
        })
        setIsScanning(false)
        pushToWallet()
      } else {
        toast.show('Something went wrong', {
          message: 'Please try again.',
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
      toast.show('Something went wrong', {
        customData: {
          preset: 'danger',
        },
      })
      pushToWallet()
    }
  }

  const retrieveCredential = async () => {
    if (receivePidUseCase?.state !== 'retrieve-credential') {
      toast.show('Not ready to retrieve PID', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (secureUnlock.state !== 'unlocked') {
      toast.show('Wallet not unlocked', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    try {
      // Retrieve Credential
      const credentials = await receivePidUseCase.retrieveCredentials()

      for (const credential of credentials) {
        if (credential instanceof SdJwtVcRecord) {
          const parsed = secureUnlock.context.agent.sdJwtVc.fromCompact<SdJwtVcHeader, PidSdJwtVcAttributes>(
            credential.compactSdJwtVc
          )
          setUserName(
            `${capitalizeFirstLetter(parsed.prettyClaims.given_name.toLowerCase())} ${capitalizeFirstLetter(
              parsed.prettyClaims.family_name.toLowerCase()
            )}`
          )

          const { display } = getCredentialForDisplay(credential)
          await addReceivedActivity(secureUnlock.context.agent, {
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
      if (error instanceof BiometricAuthenticationCancelledError) {
        toast.show('Biometric authentication cancelled', {
          customData: { preset: 'danger' },
        })
        return
      }

      // What if not supported?!?
      if (error instanceof BiometricAuthenticationNotEnabledError) {
        toast.show('Biometric authentication not enabled', {
          customData: { preset: 'danger' },
        })
        pushToWallet()
        return
      }

      toast.show('Something went wrong', { customData: { preset: 'danger' } })
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
          screen: <PidSetupStartSlide {...getPidSetupSlideContent('data-protection')} onStart={onStart} />,
        },
        {
          step: 'id-card-pin',
          progress: 30,
          screen: (
            <PidWalletPinSlide
              title="Enter your app PIN code"
              subtitle="Enter the PIN code you use to unlock your wallet."
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
              {...getPidSetupSlideContent('id-card-requested-attributes')}
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
              {...getPidSetupSlideContent('id-card-pin')}
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
              {...getPidSetupSlideContent('id-card-start-scan')}
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
                  {...getPidSetupSlideContent('id-card-verify')}
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
              {...getPidSetupSlideContent(userName ? 'id-card-complete' : 'id-card-fetch')}
              userName={userName}
              onComplete={() => pushToWallet('replace')}
            />
          ),
        },
      ].filter((s): s is NonNullable<typeof s> => s !== undefined)}
      confirmation={{
        title: 'Stop ID Setup?',
        description: 'If you stop, you can still do the setup later.',
      }}
      onCancel={onCancel}
    />
  )
}
