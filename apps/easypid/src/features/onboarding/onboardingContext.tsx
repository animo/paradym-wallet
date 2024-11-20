import { sendCommand } from '@animo-id/expo-ausweis-sdk'
import type { SdJwtVcHeader } from '@credo-ts/core'
import { type AppAgent, initializeAppAgent, useSecureUnlock } from '@easypid/agent'
import { setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { ReceivePidUseCaseCFlow } from '@easypid/use-cases/ReceivePidUseCaseCFlow'
import type {
  CardScanningErrorDetails,
  ReceivePidUseCaseFlowOptions,
  ReceivePidUseCaseState,
} from '@easypid/use-cases/ReceivePidUseCaseFlow'
import { resetWallet } from '@easypid/utils/resetWallet'
import {
  type CardScanningState,
  type OnboardingPage,
  type OnboardingStep,
  type PidFlowTypes,
  SIMULATOR_PIN,
  pidSetupSteps,
} from '@easypid/utils/sharedPidSetup'
import {
  BiometricAuthenticationCancelledError,
  BiometricAuthenticationNotEnabledError,
  SdJwtVcRecord,
} from '@package/agent'
import { secureWalletKey } from '@package/secure-store/secureUnlock'
import { useToastController } from '@package/ui'
import { capitalizeFirstLetter, getHostNameFromUrl, sleep } from '@package/utils'
import { useRouter } from 'expo-router'
import type React from 'react'
import { type PropsWithChildren, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Linking, Platform } from 'react-native'
import { type PidSdJwtVcAttributes, usePidDisplay } from '../../hooks'
import { addReceivedActivity } from '../activity/activityRecord'
import { useHasFinishedOnboarding } from './hasFinishedOnboarding'
import { OnboardingBiometrics } from './screens/biometrics'
import { OnboardingIntroductionSteps } from './screens/introduction-steps'
import OnboardingPinEnter from './screens/pin'
import OnboardingWelcome from './screens/welcome'

export const onboardingSteps = [
  {
    step: 'welcome',
    alternativeFlow: false,
    progress: 0,
    page: {
      type: 'fullscreen',
    },
    Screen: OnboardingWelcome,
  },
  {
    step: 'introduction-steps',
    alternativeFlow: false,
    progress: 16.5,
    page: {
      type: 'content',
      animation: 'delayed',
      title: 'Get your digital identity',
      subtitle: 'Before you can use the app we will go through the following steps.',
    },
    Screen: OnboardingIntroductionSteps,
  },

  {
    step: 'pin',
    alternativeFlow: false,
    progress: 33,
    page: {
      type: 'content',
      title: 'Choose a 6-digit PIN',
      subtitle: 'This PIN secures your identity wallet. You enter it every time you share data.',
      animationKey: 'pin',
    },
    Screen: OnboardingPinEnter,
  },
  {
    step: 'pin-reenter',
    alternativeFlow: false,
    progress: 33,
    page: {
      type: 'content',
      title: 'Repeat your PIN',
      subtitle: 'This PIN secures your identity wallet. You enter it every time you share data.',
      animationKey: 'pin',
    },
    Screen: OnboardingPinEnter,
  },
  {
    step: 'biometrics',
    alternativeFlow: false,
    progress: 33,
    page: {
      type: 'content',
      title: 'Set up biometrics',
      subtitle:
        'Activate the biometrics functionality of your phone to make sure only you can enter your wallet and share data.',
    },
    Screen: OnboardingBiometrics,
  },
  {
    step: 'biometrics-disabled',
    progress: 33,
    alternativeFlow: true,
    page: {
      type: 'content',
      title: 'You need to enable biometrics',
      subtitle:
        'To continue, make sure your device has biometric protection enabled, and that EasyPID is allowed to use biometrics.',
    },
    Screen: OnboardingBiometrics,
  },
  ...pidSetupSteps,
] as const satisfies Array<OnboardingStep>

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
  const toast = useToastController()
  const secureUnlock = useSecureUnlock()
  const [currentStepName, setCurrentStepName] = useState<OnboardingStep['step']>(initialStep ?? 'welcome')
  const router = useRouter()
  const [, setHasFinishedOnboarding] = useHasFinishedOnboarding()
  const pidDisplay = usePidDisplay()

  const [receivePidUseCase, setReceivePidUseCase] = useState<ReceivePidUseCaseCFlow>()
  const [receivePidUseCaseState, setReceivePidUseCaseState] = useState<ReceivePidUseCaseState | 'initializing'>()
  const [allowSimulatorCard, setAllowSimulatorCard] = useState(false)

  const [walletPin, setWalletPin] = useState<string>()
  const [idCardPin, setIdCardPin] = useState<string>()
  const [userName, setUserName] = useState<string>()
  const [agent, setAgent] = useState<AppAgent>()
  const [idCardScanningState, setIdCardScanningState] = useState<CardScanningState>({
    isCardAttached: undefined,
    progress: 0,
    state: 'readyToScan',
    showScanModal: true,
  })
  const [eidCardRequestedAccessRights, setEidCardRequestedAccessRights] = useState<string[]>()

  const currentStep = onboardingSteps.find((step) => step.step === currentStepName)
  if (!currentStep) throw new Error(`Invalid step ${currentStepName}`)

  const goToNextStep = useCallback(() => {
    const currentStepIndex = onboardingSteps.findIndex((step) => step.step === currentStepName)
    // goToNextStep excludes alternative flows
    const nextStep = onboardingSteps.slice(currentStepIndex + 1).find((step) => !step.alternativeFlow)

    if (nextStep) {
      setCurrentStepName(nextStep.step)
    } else {
      finishOnboarding()
    }
  }, [currentStepName])

  const goToPreviousStep = useCallback(() => {
    const currentStepIndex = onboardingSteps.findIndex((step) => step.step === currentStepName)
    const previousStep = [...onboardingSteps.slice(0, currentStepIndex)].reverse().find((step) => !step.alternativeFlow)

    if (previousStep) {
      setCurrentStepName(previousStep.step)
    }
  }, [currentStepName])

  const finishOnboarding = useCallback(() => {
    setHasFinishedOnboarding(true)
    // The Onboarding fades out based on the mmkv value
    // Wait 500ms before navigating to home
    setTimeout(() => {
      router.replace('/')
    }, 500)
  }, [router, setHasFinishedOnboarding])

  const onPinEnter = async (pin: string) => {
    setWalletPin(pin)
    goToNextStep()
  }

  // Bit sad but if we try to call this in the initializeAgent callback sometimes the state hasn't updated
  // in the secure unlock yet, which means that it will throw an error, so we use an effect. Probably need
  // to do a refactor on this and move more logic outside of the react world, as it's a bit weird with state
  useEffect(() => {
    if (secureUnlock.state !== 'acquired-wallet-key' || !agent) return
  }, [secureUnlock, agent])

  const initializeAgent = useCallback(async (walletKey: string) => {
    const agent = await initializeAppAgent({
      walletKey,
      walletKeyVersion: secureWalletKey.getWalletKeyVersion(),
      registerWallet: true,
    })
    setAgent(agent)
  }, [])

  const onPinReEnter = async (pin: string) => {
    // Spells BROKEN on the pin pad (with letters)
    // Allows bypassing the eID card and use a simulator card
    const isSimulatorPinCode = pin === SIMULATOR_PIN

    if (isSimulatorPinCode) {
      setAllowSimulatorCard(true)
    } else if (!walletPin || walletPin !== pin) {
      toast.show('Pin entries do not match', {
        customData: { preset: 'danger' },
      })
      setWalletPin(undefined)
      goToPreviousStep()
      throw new Error('Pin entries do not match')
    }

    if (secureUnlock.state !== 'not-configured') {
      router.replace('/')
      return
    }

    return secureUnlock
      .setup(walletPin as string)
      .then(({ walletKey }) => {
        setWalletServiceProviderPin((walletPin as string).split('').map(Number))
        return initializeAgent(walletKey)
      })
      .then(goToNextStep)
      .catch((e) => {
        reset({ error: e, resetToStep: 'welcome' })
        throw e
      })
  }

  const onEnableBiometricsDisabled = async () => {
    return Linking.openSettings().then(() => setCurrentStepName('biometrics'))
  }

  const onEnableBiometrics = async () => {
    if (!agent || (secureUnlock.state !== 'acquired-wallet-key' && secureUnlock.state !== 'unlocked')) {
      await reset({
        resetToStep: 'pin',
      })
      return
    }

    try {
      if (secureUnlock.state === 'acquired-wallet-key') {
        await secureUnlock.setWalletKeyValid({ agent }, { enableBiometrics: true })
      }

      // Directly try getting the wallet key so the user can enable biometrics
      // and we can check if biometrics works
      const walletKey = await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())

      if (!walletKey) {
        const walletKey =
          secureUnlock.state === 'acquired-wallet-key'
            ? secureUnlock.walletKey
            : secureUnlock.context.agent.config.walletConfig?.key
        if (!walletKey) {
          await reset({ resetToStep: 'pin' })
          return
        }

        await secureWalletKey.storeWalletKey(walletKey, secureWalletKey.getWalletKeyVersion())
        await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
      }

      goToNextStep()
    } catch (error) {
      // We can recover from this, and will show an error on the screen
      if (error instanceof BiometricAuthenticationCancelledError) {
        toast.show('Biometric authentication cancelled', {
          customData: { preset: 'danger' },
        })
        throw error
      }

      if (error instanceof BiometricAuthenticationNotEnabledError) {
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
    (options) => {
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
            toast.show('Invalid PIN entered for eID Card. Please try again', {
              customData: { preset: 'danger' },
            })
          })
        })
      }

      setIdCardPin(undefined)
      return idCardPin
    },
    [idCardPin, toast.show]
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

  const reset = async ({
    resetToStep = 'welcome',
    error,
    showToast = true,
    toastMessage = 'Please try again.',
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
      setAgent(undefined)
    }

    if (stepsToCompleteAfterReset.includes('id-card-start')) {
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
      setOnIdCardPinReEnter(undefined)
    }
    if (stepsToCompleteAfterReset.includes('id-card-fetch')) {
      setUserName(undefined)
    }

    if (stepsToCompleteAfterReset.includes('pin')) {
      await resetWallet(secureUnlock)
    }

    // TODO: if we already have the agent, we should either remove the wallet and start again,
    // or we need to start from the id card flow
    setCurrentStepName(resetToStep)

    if (showToast) {
      toast.show('Error occurred during onboarding', {
        message: toastMessage,
        customData: {
          preset: 'danger',
        },
      })
    }
  }

  const onStartScanning = async () => {
    if (receivePidUseCase?.state !== 'id-card-auth') {
      await reset({
        resetToStep: 'id-card-pin',
        error: 'onStartScanning: receivePidUseCaseState is not id-card-auth',
      })
      return
    }

    if (secureUnlock.state !== 'unlocked') {
      await reset({
        resetToStep: 'welcome',
        error: 'onStartScanning: secureUnlock.state is not unlocked',
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
          resetToStep: 'id-card-pin',
          error,
          showToast: false,
        })
        toast.show('eID card scanning cancelled', {
          message: 'Please try again.',
          customData: {
            preset: 'danger',
          },
        })
      } else {
        await reset({ resetToStep: 'id-card-start', error })
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
      setCurrentStepName('id-card-fetch')

      // Acquire access token
      await receivePidUseCase.acquireAccessToken()
      setCurrentStepName('id-card-verify')
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

    if (secureUnlock.state !== 'unlocked') {
      await reset({
        resetToStep: 'welcome',
        error: 'retrieveCredential: secureUnlock.state is not unlocked',
      })
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

          await addReceivedActivity(secureUnlock.context.agent, {
            entityId: receivePidUseCase.resolvedCredentialOffer.credentialOfferPayload.credential_issuer,
            host: getHostNameFromUrl(parsed.prettyClaims.iss) as string,
            name: pidDisplay?.issuer.name,
            logo: pidDisplay?.issuer.logo,
            backgroundColor: '#ffffff', // PID Logo needs white background
            credentialIds: [credential.id],
          })
        }
      }

      setCurrentStepName('id-card-complete')
    } catch (error) {
      if (error instanceof BiometricAuthenticationCancelledError) {
        toast.show('Biometric authentication cancelled', {
          customData: { preset: 'danger' },
        })
        return
      }

      // What if not supported?!?
      if (error instanceof BiometricAuthenticationNotEnabledError) {
        setCurrentStepName('id-card-biometrics-disabled')
        return
      }

      await reset({ resetToStep: 'id-card-pin', error })
    }
  }

  const goToAppSettings = () => {
    Linking.openSettings().then(() => setCurrentStepName('id-card-verify'))
  }

  const onIdCardStart = async () => {
    if (secureUnlock.state !== 'unlocked') {
      await reset({
        error: 'onIdCardStart: Secure unlock state is not unlocked',
        resetToStep: 'welcome',
      })
      throw new Error('onIdCardStart: Secure unlock state is not unlocked')
    }

    if (!walletPin) {
      await reset({ error: 'onIdCardStart: Missing walletKey in state', resetToStep: 'welcome' })
      throw new Error('onIdCardStart: Missing walletKey in state')
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
      return ReceivePidUseCaseCFlow.initialize(baseOptions)
        .then(async ({ accessRights, authFlow }) => {
          setReceivePidUseCase(authFlow)
          setEidCardRequestedAccessRights(accessRights)
          goToNextStep()
        })
        .catch(async (e) => {
          await reset({ error: e, resetToStep: 'id-card-start' })
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
    screen = <currentStep.Screen goToNextStep={onEnableBiometrics} actionText="Activate Biometrics" />
  } else if (currentStep.step === 'biometrics-disabled') {
    screen = <currentStep.Screen goToNextStep={onEnableBiometricsDisabled} actionText="Go to settings" />
  } else if (currentStep.step === 'id-card-start') {
    screen = <currentStep.Screen goToNextStep={onIdCardStart} onSkipCardSetup={finishOnboarding} />
  } else if (currentStep.step === 'id-card-requested-attributes') {
    screen = <currentStep.Screen goToNextStep={goToNextStep} requestedAttributes={eidCardRequestedAccessRights ?? []} />
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
        showScanModal={currentStep.step !== 'id-card-scan' ? false : idCardScanningState.showScanModal ?? true}
        onStartScanning={currentStep.step === 'id-card-start-scan' ? onStartScanning : undefined}
      />
    )
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
        progress: currentStep.progress,
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
