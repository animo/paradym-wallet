import { sendCommand } from '@animo-id/expo-ausweis-sdk'
import type { SdJwtVcHeader } from '@credo-ts/core'
import { SdJwtVcRecord } from '@credo-ts/core'
import { setupWalletServiceProvider, setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { ReceivePidUseCaseCFlow } from '@easypid/use-cases/ReceivePidUseCaseCFlow'
import type {
  CardScanningErrorDetails,
  ReceivePidUseCaseFlowOptions,
  ReceivePidUseCaseState,
} from '@easypid/use-cases/ReceivePidUseCaseFlow'
import type { PidSdJwtVcAttributes } from '@easypid/utils/pidCustomMetadata'
import { resetAppState } from '@easypid/utils/resetAppState'
import {
  type CardScanningState,
  type OnboardingPage,
  type OnboardingStep,
  SIMULATOR_PIN,
} from '@easypid/utils/sharedPidSetup'
import { useLingui } from '@lingui/react/macro'
import { useHaptics } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { capitalizeFirstLetter, getHostNameFromUrl, sleep } from '@package/utils'
import {
  getCredentialForDisplay,
  getCredentialForDisplayId,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
  type SdJwtVc,
  storeReceivedActivity,
  useParadym,
} from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import type React from 'react'
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Linking, Platform } from 'react-native'
import { useHasFinishedOnboarding } from './hasFinishedOnboarding'
import { onboardingSteps } from './steps'
import { useShouldUseCloudHsm } from './useShouldUseCloudHsm'

export type OnboardingContext = {
  currentStep: OnboardingStep['step']
  progress: number
  page: OnboardingPage
  screen: React.JSX.Element
  reset: () => void
}

export const OnboardingContext = createContext<OnboardingContext>({} as OnboardingContext)

export function OnboardingContextProvider({
  initialStep,
  children,
}: PropsWithChildren<{
  initialStep?: OnboardingStep['step']
}>) {
  const paradym = useParadym()

  const { successHaptic, lightHaptic } = useHaptics()
  const toast = useToastController()
  const [currentStepName, setCurrentStepName] = useState<OnboardingStep['step']>(initialStep ?? 'welcome')
  const router = useRouter()
  const [, setHasFinishedOnboarding] = useHasFinishedOnboarding()
  const [shouldUseCloudHsm, setShouldUseCloudHsm] = useShouldUseCloudHsm()
  const hasEidCardFeatureFlag = useFeatureFlag('EID_CARD')
  const hasCloudHsmFeatureFlag = useFeatureFlag('CLOUD_HSM')
  const { t } = useLingui()

  const currentStep = onboardingSteps.find((step) => step.step === currentStepName)
  if (!currentStep) throw new Error(`Invalid step ${currentStepName}`)

  const [receivePidUseCase, setReceivePidUseCase] = useState<ReceivePidUseCaseCFlow>()
  const [receivePidUseCaseState, setReceivePidUseCaseState] = useState<ReceivePidUseCaseState | 'initializing'>()
  const [allowSimulatorCard, setAllowSimulatorCard] = useState(false)

  const [walletPin, setWalletPin] = useState<string>()
  const [idCardPin, setIdCardPin] = useState<string>()
  const [userName, setUserName] = useState<string>()
  const [idCardScanningState, setIdCardScanningState] = useState<CardScanningState>({
    isCardAttached: undefined,
    progress: 0,
    state: 'readyToScan',
    showScanModal: true,
  })
  const [eidCardRequestedAccessRights, setEidCardRequestedAccessRights] = useState<string[]>()
  const [progressBar, setProgressBar] = useState(currentStep.progress)

  useEffect(() => {
    if (currentStepName === 'welcome' && paradym.state === 'locked') {
      paradym.reset()
    }
  }, [currentStepName, paradym])

  useEffect(() => {
    if (currentStepName && currentStepName !== 'welcome' && currentStepName !== 'pin-reenter') {
      lightHaptic()
    }
  }, [lightHaptic, currentStepName])

  const goToNextStep = useCallback(async () => {
    const currentStepIndex = onboardingSteps.findIndex((step) => step.step === currentStepName)
    // goToNextStep excludes alternative flows
    const nextStep = onboardingSteps.slice(currentStepIndex + 1).find((step) => !step.alternativeFlow)

    if (nextStep) {
      setCurrentStepName(nextStep.step)
    } else {
      // Animate the progress bar to 100% to gracefully finish onboarding and enter home screen
      if (progressBar !== 100) {
        setProgressBar(100)
        await sleep(600)
      }
      finishOnboarding()
    }
  }, [currentStepName, progressBar])

  const goToPreviousStep = useCallback(() => {
    const currentStepIndex = onboardingSteps.findIndex((step) => step.step === currentStepName)
    const previousStep = [...onboardingSteps.slice(0, currentStepIndex)].reverse().find((step) => !step.alternativeFlow)

    if (previousStep) {
      setCurrentStepName(previousStep.step)
    }
  }, [currentStepName])

  const finishOnboarding = useCallback(() => {
    // We don't need to handle the error if it's not active, but it's important we cancel
    receivePidUseCase?.cancelIdCardScanning().catch(() => {})

    setHasFinishedOnboarding(true)
    // The Onboarding fades out based on the mmkv value
    // Wait 500ms before navigating to home
    setTimeout(() => {
      router.replace('/')
      successHaptic()
    }, 500)
  }, [router, setHasFinishedOnboarding, receivePidUseCase, successHaptic])

  const reset = async ({
    resetToStep = 'welcome',
    error,
    showToast = true,
    toastMessage = t(commonMessages.pleaseTryAgain),
  }: {
    error?: unknown
    resetToStep: OnboardingStep['step']
    showToast?: boolean
    toastMessage?: string
  }) => {
    if (error) console.error(error)

    const stepsToCompleteAfterReset = onboardingSteps
      .slice(onboardingSteps.findIndex((step) => step.step === resetToStep))
      .map((step) => step.step)

    if (stepsToCompleteAfterReset.includes('pin')) {
      // Reset PIN state
      setWalletPin(undefined)
      setAllowSimulatorCard(false)
      // TODO(sdk): is paradym shutdown required here?
    }

    if (stepsToCompleteAfterReset.includes('id-card-requested-attributes')) {
      // We don't need to handle error
      await receivePidUseCase?.cancelIdCardScanning().catch(() => {})
      setReceivePidUseCaseState(undefined)
      setReceivePidUseCase(undefined)
      setEidCardRequestedAccessRights(undefined)
    }

    // Reset eID Card state
    if (stepsToCompleteAfterReset.includes('id-card-pin')) {
      setIdCardPin(undefined)
      setIdCardScanningState({
        progress: 0,
        state: 'readyToScan',
        isCardAttached: undefined,
        showScanModal: true,
      })
      // setOnIdCardPinReEnter(undefined)
    }
    if (stepsToCompleteAfterReset.includes('id-card-fetch')) {
      setUserName(undefined)
    }

    if (stepsToCompleteAfterReset.includes('pin')) {
      if (paradym.state === 'unlocked') {
        paradym.reset()
      }
      if (paradym.state !== 'initializing') {
        paradym.reinitialize()
      }
    }

    // TODO: if we already have the agent, we should either remove the wallet and start again,
    // or we need to start from the id card flow
    setCurrentStepName(resetToStep)

    if (showToast) {
      toast.show(
        t({
          id: 'onboarding.errorOccurred',
          message: 'Error occurred during onboarding',
        }),
        {
          message: toastMessage,
          customData: {
            preset: 'danger',
          },
        }
      )
    }
  }

  const onPinEnter = async (pin: string) => {
    setWalletPin(pin)
    goToNextStep()
  }

  const onPinReEnter = async (pin: string) => {
    // Spells BROKEN on the pin pad (with letters)
    // Allows bypassing the eID card and use a simulator card
    const isSimulatorPinCode = pin === SIMULATOR_PIN

    if (isSimulatorPinCode && hasEidCardFeatureFlag) {
      toast.show(t(commonMessages.simulatorEidCardActivated), {
        customData: {
          preset: 'success',
        },
      })
      setAllowSimulatorCard(true)
    } else if (!walletPin || walletPin !== pin) {
      toast.show(
        t({
          id: 'onboarding.pinEntriesDoNotMatch',
          message: 'Pin entries do not match',
        }),
        {
          customData: { preset: 'danger' },
        }
      )
      setWalletPin(undefined)
      goToPreviousStep()
      throw new Error('Pin entries do not match')
    }

    // When the onboarding is cancelled between the pin slide and the biometrics slide, a state occurs where the wallet is `locked`, but biometrics is not setup.
    if (paradym.state !== 'not-configured') {
      if (paradym.state === 'unlocked') {
        paradym.reset()
      }
      if (paradym.state !== 'initializing') {
        paradym.reinitialize()
      }
      resetAppState()
      await reset({ resetToStep: 'welcome' })
      return
    }

    try {
      await paradym.setPin(walletPin as string)
      await setWalletServiceProviderPin((walletPin as string).split('').map(Number), false)
      goToNextStep()
    } catch (e) {
      reset({ error: e, resetToStep: 'welcome' })
      throw e
    }
  }

  const onEnableBiometricsDisabled = async () => {
    return Linking.openSettings().then(() => setCurrentStepName('biometrics'))
  }

  const onEnableBiometrics = async () => {
    if (paradym.state !== 'acquired-wallet-key' && paradym.state !== 'unlocked') {
      await reset({
        resetToStep: 'pin',
      })
      return
    }

    try {
      if (paradym.state === 'acquired-wallet-key') {
        const sdk = await paradym.unlock({ enableBiometrics: true })
        await setupWalletServiceProvider(sdk, true)
      }

      goToNextStep()
    } catch (error) {
      // We can recover from this, and will show an error on the screen
      if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        toast.show(t(commonMessages.biometricAuthenticationCancelled), {})
        throw error
      }

      if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
        setCurrentStepName('biometrics-disabled')
        throw error
      }

      await reset({
        resetToStep: 'pin',
        error,
      })
      throw error
    }
  }

  const [onIdCardPinReEnter, setOnIdCardPinReEnter] = useState<(idCardPin: string) => Promise<void>>()

  const onEnterPin: ReceivePidUseCaseFlowOptions['onEnterPin'] = useCallback(
    (_options) => {
      if (!idCardPin) {
        // We need to hide the NFC modal on iOS, as we first need to ask the user for the pin again
        if (Platform.OS === 'ios') sendCommand({ cmd: 'INTERRUPT' })

        setIdCardScanningState((state) => ({
          ...state,
          progress: 0,
          state: 'error',
          showScanModal: true,
          isCardAttached: undefined,
        }))

        // Ask user for PIN:
        return new Promise<string>((resolve) => {
          setOnIdCardPinReEnter(() => {
            return async (idCardPin: string) => {
              setIdCardScanningState((state) => ({
                ...state,
                showScanModal: true,
              }))
              setCurrentStepName('id-card-scan')
              // UI blocks if we immediately resolve the PIN, we first want to make sure we navigate to the id-card-scan page again
              setTimeout(() => resolve(idCardPin), 100)
              setOnIdCardPinReEnter(undefined)
            }
          })

          let promise: Promise<void>
          // On android we have a custom modal, so we can keep the timeout shorten, but we do want to show the error modal for a bit.
          if (Platform.OS === 'android') {
            promise = sleep(1000).then(async () => {
              setIdCardScanningState((state) => ({
                ...state,
                state: 'readyToScan',
                showScanModal: false,
              }))

              await sleep(500)
            })
          }
          // on iOS we need to wait 3 seconds for the NFC modal to close, as otherwise it will render the keyboard and the nfc modal at the same time...
          else {
            promise = sleep(3000)
          }

          // Navigate to the id-card-pin and show a toast
          promise.then(() => {
            setCurrentStepName('id-card-pin')
            toast.show(
              t({
                id: 'onboarding.invalidEidPinEntered',
                message: 'Invalid PIN entered for eID Card. Please try again',
              }),
              {
                customData: { preset: 'danger' },
              }
            )
          })
        })
      }

      setIdCardPin(undefined)
      return idCardPin
    },
    [toast.show, t, idCardPin]
  )

  // Bit unfortunate, but we need to keep it as ref, as otherwise the value passed to ReceivePidUseCase.initialize will not get updated and we
  // don't have access to the pin. We should probably change this to something like useCase.setPin() and then .continue
  const onEnterPinRef = useRef({ onEnterPin })
  useEffect(() => {
    onEnterPinRef.current.onEnterPin = onEnterPin
  }, [onEnterPin])

  const onIdCardPinEnter = async (pin: string) => {
    setIdCardPin(pin)
    goToNextStep()
  }

  const onStartScanning = async () => {
    if (receivePidUseCase?.state !== 'id-card-auth') {
      await reset({
        resetToStep: 'id-card-pin',
        error: 'onStartScanning: receivePidUseCaseState is not id-card-auth',
      })
      return
    }

    if (paradym.state !== 'unlocked') {
      await reset({
        resetToStep: 'welcome',
        error: 'onStartScanning: paradym.state is not initialized',
      })
      return
    }

    goToNextStep()

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
        await reset({
          resetToStep: 'data-protection',
          error,
          showToast: false,
        })
        toast.show(
          t({
            id: 'onboarding.eidScanningCancelled',
            message: 'eID card scanning cancelled',
          }),
          {
            message: t(commonMessages.pleaseTryAgain),
            customData: {
              preset: 'danger',
            },
          }
        )
      } else {
        await reset({ resetToStep: 'data-protection', error })
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

      setCurrentStepName(shouldUseCloudHsm ? 'id-card-fetch' : 'id-card-verify')

      // Acquire access token
      await receivePidUseCase.acquireAccessToken(paradym.paradym)

      if (shouldUseCloudHsm) {
        await retrieveCredential()
      }
    } catch (error) {
      await reset({ resetToStep: 'id-card-pin', error })
    }
  }

  const retrieveCredential = async () => {
    if (receivePidUseCase?.state !== 'retrieve-credential') {
      await reset({
        resetToStep: 'id-card-pin',
        error: 'retrieveCredential: receivePidUseCaseState is not retrieve-credential',
      })
      return
    }

    if (paradym.state !== 'unlocked') {
      await reset({
        resetToStep: 'welcome',
        error: 'retrieveCredential: paradym.state is not initialized',
      })
      return
    }

    try {
      // Retrieve Credential
      const credentialRecords = await receivePidUseCase.retrieveCredentials()

      for (const credentialRecord of credentialRecords) {
        if (credentialRecord instanceof SdJwtVcRecord) {
          const parsed = credentialRecord.firstCredential as SdJwtVc<SdJwtVcHeader, PidSdJwtVcAttributes>
          setUserName(
            `${capitalizeFirstLetter(parsed.prettyClaims.given_name.toLowerCase())} ${capitalizeFirstLetter(
              parsed.prettyClaims.family_name.toLowerCase()
            )}`
          )

          const { display } = getCredentialForDisplay(credentialRecord)
          await storeReceivedActivity(paradym.paradym, {
            entityId: receivePidUseCase.resolvedCredentialOffer.credentialOfferPayload.credential_issuer,
            host: getHostNameFromUrl(parsed.prettyClaims.iss) as string,
            name: display.issuer.name ?? t(commonMessages.unknown),
            logo: display.issuer.logo,
            backgroundColor: '#ffffff', // PID Logo needs white background
            deferredCredentials: [],
            credentialIds: [getCredentialForDisplayId(credentialRecord)],
          })
        }
      }

      setCurrentStepName('id-card-complete')
    } catch (error) {
      if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        toast.show(t(commonMessages.biometricAuthenticationCancelled), {})
        return
      }

      // What if not supported?!?
      if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
        setCurrentStepName('id-card-biometrics-disabled')
        return
      }

      await reset({ resetToStep: 'data-protection', error })
    }
  }

  const goToAppSettings = () => {
    Linking.openSettings().then(() => setCurrentStepName('id-card-verify'))
  }

  const onIdCardStart = async (shouldUseCloudHsm: boolean) => {
    if (hasCloudHsmFeatureFlag) {
      setShouldUseCloudHsm(shouldUseCloudHsm)
    }

    if (!hasEidCardFeatureFlag) {
      // Id card setup not needed, just go to next step
      goToNextStep()
      return
    }

    if (paradym.state !== 'unlocked') {
      await reset({
        error: 'onIdCardStart: Secure unlock state is not unlocked',
        resetToStep: 'welcome',
      })
      throw new Error('onIdCardStart: Secure unlock state is not unlocked')
    }

    if (!walletPin) {
      await reset({
        error: 'onIdCardStart: Missing walletKey in state',
        resetToStep: 'welcome',
      })
      throw new Error('onIdCardStart: Missing walletKey in state')
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
      return ReceivePidUseCaseCFlow.initialize(baseOptions)
        .then(async ({ accessRights, authFlow }) => {
          setReceivePidUseCase(authFlow)
          setEidCardRequestedAccessRights(accessRights)
          goToNextStep()
        })
        .catch(async (e) => {
          await reset({ error: e, resetToStep: 'data-protection' })
          throw e
        })
    }

    // If we already have it initialized, it should be fine to resolve immediately as it should already have been set
    goToNextStep()
  }

  let screen: React.JSX.Element
  if (currentStep.step === 'welcome') {
    screen = <currentStep.Screen goToNextStep={goToNextStep} />
  } else if (currentStep.step === 'pin' || currentStep.step === 'pin-reenter') {
    screen = (
      <currentStep.Screen
        key={currentStep.page.animationKey}
        goToNextStep={currentStep.step === 'pin' ? onPinEnter : onPinReEnter}
      />
    )
  } else if (currentStep.step === 'biometrics') {
    screen = (
      <currentStep.Screen
        goToNextStep={onEnableBiometrics}
        actionText={t({
          id: 'biometrics.activateBiometricsButton',
          message: 'Activate Biometrics',
        })}
        skipText={t(commonMessages.setUpLater)}
      />
    )
  } else if (currentStep.step === 'biometrics-disabled') {
    screen = (
      <currentStep.Screen goToNextStep={onEnableBiometricsDisabled} actionText={t(commonMessages.openSettingsButton)} />
    )
  } else if (currentStep.step === 'data-protection') {
    screen = <currentStep.Screen goToNextStep={onIdCardStart} />
  } else if (currentStep.step === 'id-card-requested-attributes') {
    screen = (
      <currentStep.Screen
        goToNextStep={goToNextStep}
        onSkipCardSetup={finishOnboarding}
        requestedAttributes={eidCardRequestedAccessRights ?? []}
      />
    )
  } else if (currentStep.step === 'id-card-pin') {
    screen = <currentStep.Screen goToNextStep={onIdCardPinReEnter ?? onIdCardPinEnter} />
  } else if (currentStep.step === 'id-card-complete') {
    screen = <currentStep.Screen goToNextStep={goToNextStep} userName={userName} key={currentStep.page.animationKey} />
  } else if (currentStep.step === 'id-card-verify') {
    screen = <currentStep.Screen goToNextStep={retrieveCredential} key={currentStep.page.animationKey} />
  } else if (currentStep.step === 'id-card-biometrics-disabled') {
    screen = <currentStep.Screen goToNextStep={goToAppSettings} />
  } else if (currentStep.step === 'id-card-scan' || currentStep.step === 'id-card-start-scan') {
    screen = (
      <currentStep.Screen
        key={currentStep.page.animationKey}
        progress={idCardScanningState.progress}
        scanningState={idCardScanningState.state}
        isCardAttached={idCardScanningState.isCardAttached}
        onCancel={() => {
          receivePidUseCase?.cancelIdCardScanning()
        }}
        showScanModal={currentStep.step !== 'id-card-scan' ? false : (idCardScanningState.showScanModal ?? true)}
        onStartScanning={currentStep.step === 'id-card-start-scan' ? onStartScanning : undefined}
      />
    )
  } else if (currentStep.step === 'wallet-explanation') {
    screen = <currentStep.Screen onSkip={() => setCurrentStepName('introduction-steps')} goToNextStep={goToNextStep} />
  } else {
    screen = <currentStep.Screen goToNextStep={goToNextStep} />
  }

  const onUserReset = () =>
    reset({
      resetToStep: 'welcome',
      showToast: false,
    })

  return (
    <OnboardingContext.Provider
      value={{
        currentStep: currentStep.step,
        progress: Math.max(currentStep.progress, progressBar),
        page: currentStep.page,
        reset: onUserReset,
        screen,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboardingContext() {
  const value = useContext(OnboardingContext)
  if (!value) {
    throw new Error('useOnboardingContext must be wrapped in a <OnboardingContext.Provider />')
  }

  return value
}
