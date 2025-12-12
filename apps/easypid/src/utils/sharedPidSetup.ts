import { OnboardingDataProtection } from '@easypid/features/onboarding/screens/data-protection'
import { OnboardingIdCardBiometricsDisabled } from '@easypid/features/onboarding/screens/id-card-biometrics-disabled'
import { OnboardingIdCardFetch } from '@easypid/features/onboarding/screens/id-card-fetch'
import { OnboardingIdCardPinEnter } from '@easypid/features/onboarding/screens/id-card-pin'
import { OnboardingIdCardRequestedAttributes } from '@easypid/features/onboarding/screens/id-card-requested-attributes'
import { OnboardingIdCardScan } from '@easypid/features/onboarding/screens/id-card-scan'
import { OnboardingIdCardVerify } from '@easypid/features/onboarding/screens/id-card-verify'
import type { MessageDescriptor } from '@lingui/core'
import { defineMessage } from '@lingui/core/macro'
import type { _t } from '@lingui/react/macro'

export const SIMULATOR_PIN = '276536'

export type PidFlowTypes = 'c' | 'bprime'

export interface CardScanningState {
  showScanModal: boolean
  isCardAttached?: boolean
  progress: number
  state: 'readyToScan' | 'scanning' | 'complete' | 'error'
}

export const pidSetupMessages = {
  dataProtection: {
    title: defineMessage({ id: 'pidSetup.dataProtection.title', message: 'Protect your data' }),
    subtitle: defineMessage({
      id: 'pidSetup.dataProtection.subtitle',
      message: 'Your data is secured with a PIN and biometrics. Each time you share data, we confirm your identity.',
    }),
  },
  idCardRequestedAttributes: {
    title: defineMessage({
      id: 'pidSetup.idCardRequestedAttributes.title',
      message: 'Get your national identity card',
    }),
  },
  idCardPin: {
    title: defineMessage({ id: 'pidSetup.idCardPin.title', message: 'Enter your eID card PIN' }),
    subtitle: defineMessage({
      id: 'pidSetup.idCardPin.subtitle',
      message: 'This is required to read data from your card.',
    }),
  },
  idCardStartScan: {
    title: defineMessage({ id: 'pidSetup.idCardScan.title', message: 'Scan your eID card' }),
    subtitle: defineMessage({
      id: 'pidSetup.idCardScan.subtitle',
      message: 'Place your device on top of your eID card to scan it.',
    }),
  },
  idCardScan: {
    title: defineMessage({ id: 'pidSetup.idCardScan.title', message: 'Scan your eID card' }),
    subtitle: defineMessage({
      id: 'pidSetup.idCardScan.subtitle',
      message: 'Place your device on top of your eID card to scan it.',
    }),
  },
  idCardFetch: {
    title: defineMessage({ id: 'pidSetup.idCardFetch.title', message: 'Getting eID information' }),
  },
  idCardVerify: {
    title: defineMessage({ id: 'pidSetup.idCardVerify.title', message: 'Confirm it’s you' }),
    subtitle: defineMessage({
      id: 'pidSetup.idCardVerify.Subtitle',
      message: 'We need your biometrics to verify your identity.',
    }),
  },
  idCardBiometricsDisabled: {
    title: defineMessage({ id: 'pidSetup.enableBiometrics.title', message: 'You need to enable biometrics' }),
    subtitle: defineMessage({
      id: 'pidSetup.enableBiometrics.subtitle',
      message:
        'To continue, make sure your device has biometric protection enabled, and that Paradym Wallet is allowed to use biometrics.',
    }),
  },
  idCardComplete: {
    title: defineMessage({ id: 'pidSetup.idCardComplete.title', message: 'Success!' }),
    subtitle: defineMessage({
      id: 'pidSetup.idCardComplete.subtitle',
      message: 'Your information has been retrieved from your eID card.',
    }),
  },
}

export const pidSetupSteps = [
  {
    step: 'data-protection',
    alternativeFlow: false,
    progress: 50,
    page: {
      type: 'content',
      ...pidSetupMessages.dataProtection,
    },
    Screen: OnboardingDataProtection,
  },
  {
    step: 'id-card-requested-attributes',
    alternativeFlow: false,
    progress: 60,
    page: {
      type: 'content',
      ...pidSetupMessages.idCardRequestedAttributes,
    },
    Screen: OnboardingIdCardRequestedAttributes,
  },
  {
    step: 'id-card-pin',
    alternativeFlow: false,
    progress: 60,
    page: {
      type: 'content',
      ...pidSetupMessages.idCardPin,
    },
    Screen: OnboardingIdCardPinEnter,
  },
  {
    step: 'id-card-start-scan',
    alternativeFlow: false,
    progress: 70,
    page: {
      type: 'content',
      ...pidSetupMessages.idCardStartScan,
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
      ...pidSetupMessages.idCardScan,
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
      ...pidSetupMessages.idCardFetch,
    },
    Screen: OnboardingIdCardFetch,
  },
  {
    step: 'id-card-verify',
    progress: 90,
    alternativeFlow: true,
    page: {
      type: 'content',
      ...pidSetupMessages.idCardVerify,
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
      ...pidSetupMessages.idCardBiometricsDisabled,
    },
    Screen: OnboardingIdCardBiometricsDisabled,
  },
  {
    step: 'id-card-complete',
    progress: 100,
    alternativeFlow: false,
    page: {
      type: 'content',
      ...pidSetupMessages.idCardComplete,
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
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  Screen: React.FunctionComponent<any>
}

export type OnboardingPage =
  | { type: 'fullscreen' }
  | {
      type: 'content'
      title?: MessageDescriptor
      animation?: 'default' | 'delayed'
      subtitle?: MessageDescriptor
      animationKey?: string
    }

export const getPidSetupSlideContent = (stepId: string, t: typeof _t) => {
  const step = pidSetupSteps.find((s) => s.step === stepId)
  if (!step || step.page.type !== 'content') {
    return { title: '', subtitle: undefined }
  }

  return {
    title: t(step.page.title) ?? '',
    subtitle: 'subtitle' in step.page ? t(step.page.subtitle) : undefined,
  }
}
