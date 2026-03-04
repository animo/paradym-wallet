import { setupWalletServiceProvider, setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { resetAppState } from '@easypid/utils/resetAppState'
import type { OnboardingPage, OnboardingStep } from '@easypid/utils/sharedPidSetup'
import { useLingui } from '@lingui/react/macro'
import { useHaptics } from '@package/app'
import {
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
  useParadym,
} from '@package/sdk'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { sleep } from '@package/utils'
import { useRouter } from 'expo-router'
import type React from 'react'
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { useHasFinishedOnboarding } from './hasFinishedOnboarding'
import { onboardingSteps } from './steps'

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
  const { t } = useLingui()

  const currentStep = onboardingSteps.find((step) => step.step === currentStepName)
  if (!currentStep) throw new Error(`Invalid step ${currentStepName}`)

  const [walletPin, setWalletPin] = useState<string>()
  const [progressBar, setProgressBar] = useState<typeof currentStep.progress | 100>(currentStep.progress)

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
    setHasFinishedOnboarding(true)
    // The Onboarding fades out based on the mmkv value
    // Wait 500ms before navigating to home
    setTimeout(() => {
      router.replace('/')
      successHaptic()
    }, 500)
  }, [router, setHasFinishedOnboarding, successHaptic])

  const onPinEnter = async (pin: string) => {
    setWalletPin(pin)
    goToNextStep()
  }

  const onPinReEnter = async (pin: string) => {
    if (!walletPin || walletPin !== pin) {
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
