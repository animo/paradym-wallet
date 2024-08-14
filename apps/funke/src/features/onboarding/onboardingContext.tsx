import { sendCommand } from '@animo-id/expo-ausweis-sdk'
import type { SdJwtVcHeader } from '@credo-ts/core'
import { initializeAppAgent, useSecureUnlock } from '@funke/agent'
import {
  ReceivePidUseCase,
  type ReceivePidUseCaseOptions,
  type ReceivePidUseCaseState,
} from '@funke/use-cases/ReceivePidUseCase'
import { type FunkeAppAgent, storeCredential } from '@package/agent'
import { useToastController } from '@package/ui'
import { capitalizeFirstLetter } from '@package/utils'
import { useRouter } from 'expo-router'
import type React from 'react'
import { type PropsWithChildren, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { OnboardingBiometrics } from './screens/biometrics'
import { OnboardingIdCardFetch } from './screens/id-card-fetch'
import { OnboardingIdCardPinEnter } from './screens/id-card-pin'
import { OnboardingIdCardScan } from './screens/id-card-scan'
import { OnboardingIdCardStartScan } from './screens/id-card-start-scan'
import { OnboardingIntroductionSteps } from './screens/introduction-steps'
import OnboardingPinEnter from './screens/pin'
import OnboardingWelcome from './screens/welcome'

type Page = { type: 'fullscreen' } | { type: 'content'; title: string; subtitle?: string; animationKey?: string }

// Same animation key means the content won't fade out and then in again. So if the two screens have most content in common
// this looks nicer.
const onboardingStepsCFlow = [
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
    progress: 0,
    page: {
      type: 'content',
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
      subtitle: 'This will be used to unlock the Ausweis Wallet.',
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
      animationKey: 'pin',
    },
    Screen: OnboardingPinEnter,
  },
  {
    step: 'biometrics',
    progress: 33,
    page: {
      type: 'content',
      title: 'Let’s secure your wallet',
      subtitle:
        'The Ausweis wallet will be unlocked using the biometrics functionality of your phone. This is to make sure only you can enter your wallet.',
    },
    Screen: OnboardingBiometrics,
  },
  {
    step: 'id-card-pin',
    progress: 66,
    page: {
      type: 'content',
      title: 'Enter your eID pin',
      subtitle: 'This will be used in the next step to unlock your eID.',
    },
    Screen: OnboardingIdCardPinEnter,
  },
  {
    step: 'id-card-start-scan',
    progress: 66,
    page: {
      type: 'content',
      title: 'Place your eID card at the top of you phone.',
      animationKey: 'id-card-scan',
    },
    Screen: OnboardingIdCardStartScan,
  },
  {
    step: 'id-card-scan',
    progress: 66,
    page: {
      type: 'content',
      title: 'Keep your eID card still',
      animationKey: 'id-card-scan',
    },
    Screen: OnboardingIdCardScan,
  },
  {
    step: 'id-card-fetch',
    progress: 66,
    page: {
      type: 'content',
      title: 'Setting up identity',
      animationKey: 'id-card-final',
    },
    Screen: OnboardingIdCardFetch,
  },
  {
    step: 'id-card-complete',
    progress: 100,
    page: {
      type: 'content',
      title: 'Your wallet is ready',
      animationKey: 'id-card-final',
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

export type OnboardingSteps = typeof onboardingStepsCFlow
export type OnboardingStep = OnboardingSteps[number]

export type OnboardingContext = {
  currentStep: OnboardingStep['step']
  progress: number
  page: Page
  screen: React.JSX.Element
}

export const OnboardingContext = createContext<OnboardingContext>({} as OnboardingContext)

export function OnboardingContextProvider({
  initialStep,
  children,
}: PropsWithChildren<{ initialStep?: OnboardingStep['step']; flow?: 'c' | 'bprime' }>) {
  const toast = useToastController()
  const secureUnlock = useSecureUnlock()
  const [currentStepName, setCurrentStepName] = useState<OnboardingStep['step']>(initialStep ?? 'welcome')
  const router = useRouter()

  const [receivePidUseCase, setReceivePidUseCase] = useState<ReceivePidUseCase>()
  const [receivePidUseCaseState, setReceivePidUseCaseState] = useState<ReceivePidUseCaseState | 'initializing'>()
  const [walletPin, setWalletPin] = useState<string>()
  const [idCardPin, setIdCardPin] = useState<string>()
  const [userName, setUserName] = useState<string>()
  const [agent, setAgent] = useState<FunkeAppAgent>()

  const currentStep = onboardingStepsCFlow.find((step) => step.step === currentStepName)
  if (!currentStep) throw new Error(`Invalid step ${currentStepName}`)

  const goToNextStep = useCallback(() => {
    const currentStepIndex = onboardingStepsCFlow.findIndex((step) => step.step === currentStepName)
    const nextStep = onboardingStepsCFlow[currentStepIndex + 1]

    if (nextStep) {
      setCurrentStepName(nextStep.step)
    } else {
      // Navigate to the actual app.
      router.replace('/')
    }
  }, [currentStepName, router])

  const goToPreviousStep = useCallback(() => {
    const currentStepIndex = onboardingStepsCFlow.findIndex((step) => step.step === currentStepName)
    const previousStep = onboardingStepsCFlow[currentStepIndex - 1]

    if (previousStep) {
      setCurrentStepName(previousStep.step)
    }
  }, [currentStepName])

  const onPinEnter = async (pin: string) => {
    setWalletPin(pin)
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
      toast.show('Pin entries do not match', { customData: { preset: 'danger' } })
      setWalletPin(undefined)
      goToPreviousStep()
      throw new Error('Pin entries do not match')
    }

    if (secureUnlock.state !== 'not-configured') {
      router.replace('/')
      return
    }

    return secureUnlock
      .setup(walletPin)
      .then(({ walletKey }) => initializeAgent(walletKey))
      .then(() => goToNextStep())
      .catch((e) => {
        reset({ error: e, resetToStep: 'welcome' })
        throw e
      })
  }

  const [onIdCardPinReEnter, setOnIdCardPinReEnter] = useState<(idCardPin: string) => Promise<void>>()

  const onEnterPin: ReceivePidUseCaseOptions['onEnterPin'] = useCallback(
    (options) => {
      if (!idCardPin) {
        // We need to hide the NFC modal on iOS, as we first need to ask the user for the pin again
        sendCommand({ cmd: 'INTERRUPT' })

        // Ask user for PIN:
        return new Promise<string>((resolve) => {
          setOnIdCardPinReEnter(() => {
            return async (idCardPin: string) => {
              setCurrentStepName('id-card-scan')
              // UI blocks if we immediately resolve the PIN, we first want to make sure we navigate to the id-card-scan page again
              setTimeout(() => resolve(idCardPin), 100)
              setOnIdCardPinReEnter(undefined)
            }
          })
          // If we don't wait for a bit, it will render the keyboard and the nfc modal at the same time...
          setTimeout(() => {
            toast.show('Invalid PIN entered for eID Card. Please try again', { customData: { preset: 'danger' } })
            setCurrentStepName('id-card-pin')
          }, 3000)
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
      reset({ error: 'onIdCardPinEnter: Secure unlock state is not unlocked', resetToStep: 'welcome' })
      throw new Error('onIdCardPinEnter: Secure unlock state is not unlocked')
    }

    if (!receivePidUseCase && receivePidUseCaseState !== 'initializing') {
      return ReceivePidUseCase.initialize({
        agent: secureUnlock.context.agent,
        onStateChange: setReceivePidUseCaseState,
        onEnterPin: (options) => onEnterPinRef.current.onEnterPin(options),
      })
        .then((receivePidUseCase) => {
          setReceivePidUseCase(receivePidUseCase)
          goToNextStep()
        })
        .catch((e) => {
          reset({ error: e, resetToStep: 'id-card-pin' })
          throw e
        })
    }

    goToNextStep()
    return
  }

  const reset = ({ resetToStep = 'welcome', error }: { error?: unknown; resetToStep: OnboardingStep['step'] }) => {
    if (error) console.error(error)

    const stepsToCompleteAfterReset = onboardingStepsCFlow
      .slice(onboardingStepsCFlow.findIndex((step) => step.step === resetToStep))
      .map((step) => step.step)

    if (stepsToCompleteAfterReset.includes('pin')) {
      // Reset PIN state
      setWalletPin(undefined)
      setAgent(undefined)
    }

    // Reset eID Card state
    if (stepsToCompleteAfterReset.includes('id-card-pin')) {
      // TODO: we need to be able to re-initialize the expo ausweis sdk
      setReceivePidUseCaseState(undefined)
      setReceivePidUseCase(undefined)
      setOnIdCardPinReEnter(undefined)
    }
    if (stepsToCompleteAfterReset.includes('id-card-fetch')) {
      setUserName(undefined)
    }
    if (stepsToCompleteAfterReset.includes('id-card-pin')) {
      setIdCardPin(undefined)
    }

    // TODO: if we already have the agent, we should either remove the wallet and start again,
    // or we need to start from the id card flow
    setCurrentStepName(resetToStep)

    toast.show('Error occurred during onboarding', {
      message: 'Please try again.',
      customData: {
        preset: 'danger',
      },
    })
  }

  const onStartScanning = async () => {
    if (receivePidUseCase?.state !== 'id-card-auth') {
      reset({ resetToStep: 'id-card-pin', error: 'onStartScanning: receivePidUseCaseState is not id-card-auth' })
      return
    }

    // FIXME: we should probably remove the database here.
    if (secureUnlock.state !== 'unlocked') {
      reset({ resetToStep: 'welcome', error: 'onStartScanning: secureUnlock.state is not unlocked' })
      return
    }

    try {
      goToNextStep()
      // Authenticate
      await receivePidUseCase.authenticateUsingIdCard()

      // The modal on iOS is so slooooooow.
      // TODO: we probably don't need this on Android
      setTimeout(async () => {
        try {
          setCurrentStepName('id-card-fetch')

          // Acquire access token
          await receivePidUseCase.acquireAccessToken()

          // Retrieve Credential
          const credential = await receivePidUseCase.retrieveCredential()
          await storeCredential(secureUnlock.context.agent, credential)
          const parsed = secureUnlock.context.agent.sdJwtVc.fromCompact<
            SdJwtVcHeader,
            { given_name: string; family_name: string }
          >(credential.compactSdJwtVc)
          setUserName(
            `${capitalizeFirstLetter(parsed.prettyClaims.given_name.toLowerCase())} ${capitalizeFirstLetter(parsed.prettyClaims.family_name.toLowerCase())}`
          )
          setCurrentStepName('id-card-complete')
        } catch (error) {
          reset({ resetToStep: 'id-card-pin', error })
        }
      }, 2000)
    } catch (error) {
      reset({ resetToStep: 'id-card-pin', error })
    }
  }

  let screen: React.JSX.Element
  if (currentStep.step === 'pin' || currentStep.step === 'pin-reenter') {
    screen = <currentStep.Screen key="pin-now" goToNextStep={currentStep.step === 'pin' ? onPinEnter : onPinReEnter} />
  } else if (currentStep.step === 'id-card-pin') {
    screen = <currentStep.Screen goToNextStep={onIdCardPinReEnter ?? onIdCardPinEnter} />
  } else if (currentStep.step === 'id-card-start-scan') {
    screen = <currentStep.Screen goToNextStep={onStartScanning} />
  } else if (currentStep.step === 'id-card-complete') {
    screen = <currentStep.Screen goToNextStep={goToNextStep} userName={userName} />
  } else {
    screen = <currentStep.Screen goToNextStep={goToNextStep} />
  }

  return (
    <OnboardingContext.Provider
      value={{
        currentStep: currentStep.step,
        progress: currentStep.progress,
        page: currentStep.page,
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
