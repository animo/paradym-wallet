import { OnboardingDataProtection } from '@easypid/features/onboarding/screens/data-protection'
import { OnboardingIdCardBiometricsDisabled } from '@easypid/features/onboarding/screens/id-card-biometrics-disabled'
import { OnboardingIdCardFetch } from '@easypid/features/onboarding/screens/id-card-fetch'
import { OnboardingIdCardPinEnter } from '@easypid/features/onboarding/screens/id-card-pin'
import { OnboardingIdCardRequestedAttributes } from '@easypid/features/onboarding/screens/id-card-requested-attributes'
import { OnboardingIdCardScan } from '@easypid/features/onboarding/screens/id-card-scan'
import { OnboardingIdCardVerify } from '@easypid/features/onboarding/screens/id-card-verify'

export const SIMULATOR_PIN = '276536'

export type PidFlowTypes = 'c' | 'bprime'

export interface CardScanningState {
  showScanModal: boolean
  isCardAttached?: boolean
  progress: number
  state: 'readyToScan' | 'scanning' | 'complete' | 'error'
}

export const pidSetupSteps = [
  {
    step: 'data-protection',
    alternativeFlow: false,
    progress: 50,
    page: {
      type: 'content',
      title: 'Protect your data',
      subtitle: 'Your data is secured with a PIN and biometrics. Each time you share data, we confirm your identity.',
    },
    Screen: OnboardingDataProtection,
  },
  {
    step: 'id-card-requested-attributes',
    alternativeFlow: false,
    progress: 60,
    page: {
      type: 'content',
      title: 'Get your national identity card',
    },
    Screen: OnboardingIdCardRequestedAttributes,
  },
  {
    step: 'id-card-pin',
    alternativeFlow: false,
    progress: 60,
    page: {
      type: 'content',
      title: 'Enter your eID card PIN',
      subtitle: 'This is required to read data from your card.',
    },
    Screen: OnboardingIdCardPinEnter,
  },
  {
    step: 'id-card-start-scan',
    alternativeFlow: false,
    progress: 70,
    page: {
      type: 'content',
      title: 'Scan your eID card',
      subtitle: 'Place your device on top of your eID card to scan it.',
      animationKey: 'id-card-scan',
    },
    Screen: OnboardingIdCardScan,
  },
  {
    step: 'id-card-scan',
    alternativeFlow: false,
    progress: 70,
    page: {
      type: 'content',
      title: 'Scan your eID card',
      subtitle: 'Place your device on top of your eID card to scan it.',
      animationKey: 'id-card-scan',
    },
    Screen: OnboardingIdCardScan,
  },
  {
    step: 'id-card-fetch',
    alternativeFlow: false,
    progress: 80,
    page: {
      type: 'content',
      title: 'Getting eID information',
    },
    Screen: OnboardingIdCardFetch,
  },
  {
    step: 'id-card-verify',
    progress: 90,
    alternativeFlow: true,
    page: {
      type: 'content',
      title: 'Confirm it’s you',
      subtitle: 'We need your biometrics to verify your identity.',
      animationKey: 'id-card',
    },
    Screen: OnboardingIdCardVerify,
  },
  {
    step: 'id-card-biometrics-disabled',
    progress: 90,
    alternativeFlow: true,
    page: {
      type: 'content',
      title: 'You need to enable biometrics',
      subtitle:
        'To continue, make sure your device has biometric protection enabled, and that EasyPID is allowed to use biometrics.',
    },
    Screen: OnboardingIdCardBiometricsDisabled,
  },
  {
    step: 'id-card-complete',
    progress: 100,
    alternativeFlow: false,
    page: {
      type: 'content',
      title: 'Success!',
      subtitle: 'Your information has been retrieved from your eID card.',
      animationKey: 'id-card-success',
    },
    Screen: OnboardingIdCardFetch,
  },
] as const satisfies Array<OnboardingStep>

export type OnboardingStep = {
  step: string
  progress: number
  page: OnboardingPage
  // if true will not be navigated to by goToNextStep
  alternativeFlow: boolean
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Screen: React.FunctionComponent<any>
}

export type OnboardingPage =
  | { type: 'fullscreen' }
  | {
      type: 'content'
      title: string
      animation?: 'default' | 'delayed'
      subtitle?: string
      animationKey?: string
    }

export const getPidSetupSlideContent = (stepId: string) => {
  const step = pidSetupSteps.find((s) => s.step === stepId)
  if (!step || step.page.type !== 'content') {
    return { title: '', subtitle: undefined, caption: undefined }
  }

  return {
    title: step.page.title,
    subtitle: 'subtitle' in step.page ? step.page.subtitle : undefined,
    caption: 'caption' in step.page ? step.page.caption : undefined,
  }
}
