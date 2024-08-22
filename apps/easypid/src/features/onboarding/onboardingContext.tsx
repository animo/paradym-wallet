import { sendCommand } from '@animo-id/expo-ausweis-sdk'
import type { SdJwtVcHeader } from '@credo-ts/core'
import { type AppAgent, initializeAppAgent, useSecureUnlock } from '@easypid/agent'
import { ReceivePidUseCaseBPrimeFlow } from '@easypid/use-cases/ReceivePidUseCaseBPrimeFlow'
import {
  type CardScanningErrorDetails,
  ReceivePidUseCaseCFlow,
  type ReceivePidUseCaseCFlowOptions,
  type ReceivePidUseCaseState,
} from '@easypid/use-cases/ReceivePidUseCaseCFlow'
import { resetWallet } from '@easypid/utils/resetWallet'
import { storeCredential } from '@package/agent'
import { useToastController } from '@package/ui'
import { capitalizeFirstLetter, sleep } from '@package/utils'
import { useRouter } from 'expo-router'
import type React from 'react'
import { type PropsWithChildren, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { useHasFinishedOnboarding } from './hasFinishedOnboarding'
import { OnboardingBiometrics } from './screens/biometrics'
import { OnboardingIdCardFetch } from './screens/id-card-fetch'
import { OnboardingIdCardPinEnter } from './screens/id-card-pin'
import { OnboardingIdCardScan } from './screens/id-card-scan'
import { OnboardingIdCardStart } from './screens/id-card-start'
import { OnboardingIdCardVerify } from './screens/id-card-verify'
import { OnboardingIntroductionSteps } from './screens/introduction-steps'
import OnboardingPinEnter from './screens/pin'
import OnboardingWelcome from './screens/welcome'

type Page =
  | { type: 'fullscreen' }
  | {
      type: 'content'
      title: string
      animation?: 'default' | 'delayed'
      subtitle?: string
      caption?: string
      animationKey?: string
    }

// Same animation key means the content won't fade out and then in again. So if the two screens have most content in common
// this looks nicer.
const onboardingSteps = [
  {
    step: 'welcome',
    progress: 0,
    page: {
      type: 'fullscreen',
    },
    Screen: OnboardingWelcome,
  },
  {
    step: 'introduction-steps',
    progress: 16.5,
    page: {
      type: 'content',
      animation: 'delayed',
      title: 'Setup digital identity',
      subtitle: "To setup your digital identity we'll follow the following steps:",
    },
    Screen: OnboardingIntroductionSteps,
  },
  {
    step: 'pin',
    progress: 33,
    page: {
      type: 'content',
      title: 'Pick a 6-digit app pin',
      subtitle: 'You are required to enter your identity pin every time you share data with a party.',
      animationKey: 'pin',
    },
    Screen: OnboardingPinEnter,
  },
  {
    step: 'pin-reenter',
    progress: 33,
    page: {
      type: 'content',
      title: 'Re-enter your pin',
      subtitle: 'You are required to enter your identity pin every time you share data with a party.',
      animationKey: 'pin',
    },
    Screen: OnboardingPinEnter,
  },
  {
    step: 'biometrics',
    progress: 49.5,
    page: {
      type: 'content',
      title: 'Let’s secure your wallet',
      subtitle:
        'The wallet will be unlocked using the biometrics functionality of your phone. This is to make sure only you can enter your wallet.',
    },
    Screen: OnboardingBiometrics,
  },
  {
    step: 'id-card-start',
    progress: 66,
    page: {
      type: 'content',
      title: 'Scan your eID card to verify your identity',
      subtitle: 'You’ll need to setup your wallet using your physical eID card and the eID pin.',
      caption:
        'Your eID pin has been configured previously when you received your eID card and is different from your app pin.',
    },
    Screen: OnboardingIdCardStart,
  },
  {
    step: 'id-card-pin',
    progress: 66,
    page: {
      type: 'content',
      title: 'Enter your eID pin',
    },
    Screen: OnboardingIdCardPinEnter,
  },
  {
    step: 'id-card-start-scan',
    progress: 66,
    page: {
      type: 'content',
      title: 'Scanning your eID card',
      subtitle:
        Platform.OS === 'android'
          ? 'Place your eID card on your device’s back side.'
          : 'Place your eID card at the top of the device’s back side.',
      animationKey: 'id-card-scan',
    },
    Screen: OnboardingIdCardScan,
  },
  {
    step: 'id-card-scan',
    progress: 66,
    page: {
      type: 'content',
      title: 'Scanning your eID card',
      subtitle:
        Platform.OS === 'android'
          ? 'Place your eID card on your device’s back side.'
          : 'Place your eID card at the top of the device’s back side.',
      animationKey: 'id-card-scan',
    },
    Screen: OnboardingIdCardScan,
  },
  {
    step: 'id-card-fetch',
    progress: 66,
    page: {
      type: 'content',
      title: 'Fetching information',
    },
    Screen: OnboardingIdCardFetch,
  },
  {
    step: 'id-card-verify',
    progress: 82.5,
    page: {
      type: 'content',
      title: 'We need to verify it’s you',
      subtitle: 'Your biometrics are required to unlock your identity.',
      animationKey: 'id-card',
    },
    Screen: OnboardingIdCardVerify,
  },
  {
    step: 'id-card-complete',
    progress: 100,
    page: {
      type: 'content',
      title: 'Success!',
      subtitle: 'The information has been retrieved from your eID card.',
      animationKey: 'id-card',
    },
    Screen: OnboardingIdCardFetch,
  },
] as const satisfies Array<{
  step: string
  progress: number
  page: Page
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Screen: React.FunctionComponent<any>
}>

export type OnboardingSteps = typeof onboardingSteps
export type OnboardingStep = OnboardingSteps[number]

export type OnboardingContext = {
  currentStep: OnboardingStep['step']
  progress: number
  page: Page
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

  const [selectedFlow, setSelectedFlow] = useState<'c' | 'bprime'>('c')
  const [receivePidUseCase, setReceivePidUseCase] = useState<ReceivePidUseCaseCFlow | ReceivePidUseCaseBPrimeFlow>()
  const [receivePidUseCaseState, setReceivePidUseCaseState] = useState<ReceivePidUseCaseState | 'initializing'>()

  const [walletPin, setWalletPin] = useState<string>()
  const [idCardPin, setIdCardPin] = useState<string>()
  const [userName, setUserName] = useState<string>()
  const [agent, setAgent] = useState<AppAgent>()
  const [idCardScanningState, setIdCardScanningState] = useState<{
    showScanModal: boolean
    isCardAttached?: boolean
    progress: number
    state: 'readyToScan' | 'scanning' | 'complete' | 'error'
  }>({
    isCardAttached: undefined,
    progress: 0,
    state: 'readyToScan',
    showScanModal: true,
  })

  const currentStep = onboardingSteps.find((step) => step.step === currentStepName)
  if (!currentStep) throw new Error(`Invalid step ${currentStepName}`)

  const goToNextStep = useCallback(() => {
    const currentStepIndex = onboardingSteps.findIndex((step) => step.step === currentStepName)
    const nextStep = onboardingSteps[currentStepIndex + 1]

    if (nextStep) {
      setCurrentStepName(nextStep.step)
    } else {
      // Navigate to the actual app.
      setHasFinishedOnboarding(true)
      router.replace('/')
    }
  }, [currentStepName, router, setHasFinishedOnboarding])

  const goToPreviousStep = useCallback(() => {
    const currentStepIndex = onboardingSteps.findIndex((step) => step.step === currentStepName)
    const previousStep = onboardingSteps[currentStepIndex - 1]

    if (previousStep) {
      setCurrentStepName(previousStep.step)
    }
  }, [currentStepName])

  const onPinEnter = async (pin: string) => {
    setWalletPin(pin)
    goToNextStep()
  }

  const selectFlow = (flow: 'c' | 'bprime') => {
    setSelectedFlow(flow)

    goToNextStep()
  }

  // Bit sad but if we try to call this in the initializeAgent callback sometimes the state hasn't updated
  // in the secure unlock yet, which means that it will throw an error, so we use an effect. Probably need
  // to do a refactor on this and move more logic outside of the react world, as it's a bit weird with state
  useEffect(() => {
    if (secureUnlock.state !== 'acquired-wallet-key' || !agent) return

    secureUnlock.setWalletKeyValid({ agent }, { enableBiometrics: true })
  }, [secureUnlock, agent])

  const initializeAgent = useCallback(async (walletKey: string) => {
    const agent = await initializeAppAgent({
      walletKey,
    })
    setAgent(agent)
  }, [])

  const onPinReEnter = async (pin: string) => {
    if (walletPin !== pin) {
      toast.show('Pin entries do not match', {
        customData: { preset: 'danger' },
      })
      setWalletPin(undefined)
      goToPreviousStep()
      throw new Error('Pin entries do not match')
    }

    console.log(secureUnlock.state)
    if (secureUnlock.state !== 'not-configured') {
      router.replace('/')
      return
    }

    return secureUnlock
      .setup(walletPin)
      .then(async ({ walletKey }) => initializeAgent(walletKey))
      .then(() => goToNextStep())
      .catch(async (e) => {
        await reset({ error: e, resetToStep: 'welcome' })
        throw e
      })
  }

  const [onIdCardPinReEnter, setOnIdCardPinReEnter] = useState<(idCardPin: string) => Promise<void>>()

  const onEnterPin: ReceivePidUseCaseCFlowOptions['onEnterPin'] = useCallback(
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

    if (secureUnlock.state !== 'unlocked') {
      await reset({
        error: 'onIdCardPinEnter: Secure unlock state is not unlocked',
        resetToStep: 'welcome',
      })
      throw new Error('onIdCardPinEnter: Secure unlock state is not unlocked')
    }

    if (!receivePidUseCase && receivePidUseCaseState !== 'initializing') {
      if (selectedFlow === 'c') {
        return ReceivePidUseCaseCFlow.initialize({
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
        }).then((receivePidUseCase) => {
          setReceivePidUseCase(receivePidUseCase)
          goToNextStep()
        })
      }
      if (selectedFlow === 'bprime') {
        if (!walletPin) {
          throw new Error('wallet Pin has not been setup!')
        }
        return ReceivePidUseCaseBPrimeFlow.initialize({
          agent: secureUnlock.context.agent,
          onStateChange: setReceivePidUseCaseState,
          onEnterPin: (options) => onEnterPinRef.current.onEnterPin(options),
          pidPin: walletPin.split('').map(Number),
        })
          .then((receivePidUseCase) => {
            setReceivePidUseCase(receivePidUseCase)
            goToNextStep()
          })
          .catch(async (e) => {
            await reset({ error: e, resetToStep: 'id-card-pin' })
            throw e
          })
      }
    }

    goToNextStep()
    return
  }

  const reset = async ({
    resetToStep = 'welcome',
    error,
    showToast = true,
  }: {
    error?: unknown
    resetToStep: OnboardingStep['step']
    showToast?: boolean
  }) => {
    if (error) console.error(error)

    const stepsToCompleteAfterReset = onboardingSteps
      .slice(onboardingSteps.findIndex((step) => step.step === resetToStep))
      .map((step) => step.step)

    if (stepsToCompleteAfterReset.includes('pin')) {
      // Reset PIN state
      setWalletPin(undefined)
      setAgent(undefined)
    }

    // Reset eID Card state
    if (stepsToCompleteAfterReset.includes('id-card-pin')) {
      setIdCardPin(undefined)
      setReceivePidUseCaseState(undefined)
      setReceivePidUseCase(undefined)
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
        message: 'Please try again.',
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
        await reset({ resetToStep: 'id-card-pin', error })
      }

      return
    }

    try {
      setIdCardScanningState((state) => ({ ...state, state: 'complete', progress: 100 }))

      // on iOS it takes around two seconds for the modal to close. On Android we wait 1 second
      // and then close the modal
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIdCardScanningState((state) => ({ ...state, showScanModal: false }))
      await new Promise((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 500 : 1000))
      setCurrentStepName('id-card-fetch')

      // Acquire access token
      await receivePidUseCase.acquireAccessToken()

      if (selectedFlow === 'c') {
        // For c flow we need to do a biometrics check, so we first inform the user of that
        setCurrentStepName('id-card-verify')
      } else if (selectedFlow === 'bprime') {
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

    if (secureUnlock.state !== 'unlocked') {
      await reset({
        resetToStep: 'welcome',
        error: 'retrieveCredential: secureUnlock.state is not unlocked',
      })
      return
    }

    try {
      // Retrieve Credential
      const credential = await receivePidUseCase.retrieveCredential()
      await storeCredential(secureUnlock.context.agent, credential)
      const parsed = secureUnlock.context.agent.sdJwtVc.fromCompact<
        SdJwtVcHeader,
        { given_name: string; family_name: string }
      >(credential.compactSdJwtVc)
      setUserName(
        `${capitalizeFirstLetter(parsed.prettyClaims.given_name.toLowerCase())} ${capitalizeFirstLetter(
          parsed.prettyClaims.family_name.toLowerCase()
        )}`
      )
      setCurrentStepName('id-card-complete')
    } catch (error) {
      await reset({ resetToStep: 'id-card-pin', error })
    }
  }

  let screen: React.JSX.Element
  if (currentStep.step === 'welcome') {
    screen = <currentStep.Screen goToNextStep={selectFlow} />
  } else if (currentStep.step === 'pin' || currentStep.step === 'pin-reenter') {
    screen = (
      <currentStep.Screen
        key={currentStep.page.animationKey}
        goToNextStep={currentStep.step === 'pin' ? onPinEnter : onPinReEnter}
      />
    )
  } else if (currentStep.step === 'id-card-pin') {
    screen = <currentStep.Screen goToNextStep={onIdCardPinReEnter ?? onIdCardPinEnter} />
  } else if (currentStep.step === 'id-card-complete') {
    screen = <currentStep.Screen goToNextStep={goToNextStep} userName={userName} key={currentStep.page.animationKey} />
  } else if (currentStep.step === 'id-card-verify') {
    screen = <currentStep.Screen goToNextStep={retrieveCredential} key={currentStep.page.animationKey} />
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
        showScanModal={idCardScanningState.showScanModal ?? true}
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
