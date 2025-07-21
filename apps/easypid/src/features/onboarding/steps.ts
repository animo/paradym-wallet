import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { type OnboardingStep, pidSetupSteps, pidSetupMessages } from '@easypid/utils/sharedPidSetup'
import { OnboardingBiometrics } from './screens/biometrics'
import { OnboardingDataProtection } from './screens/data-protection'
import { OnboardingIntroductionSteps } from './screens/introduction-steps'
import OnboardingPinEnter from './screens/pin'
import { OnboardingWalletExplanation } from './screens/wallet-explanation'
import OnboardingWelcome from './screens/welcome'
import { defineMessage } from '@lingui/core/macro'

// Shared messages
const pinTitle = defineMessage({
  id: 'onboarding.pin.title',
  message: 'Choose a 6-digit PIN',
  comment: 'Heading when user chooses a PIN',
})

const pinSubtitle = defineMessage({
  id: 'onboarding.pin.subtitle',
  message: 'This PIN secures your identity wallet. You enter it every time you share data.',
  comment: 'Explanation of the PIN purpose in onboarding',
})

const pinSubtitleSimple = defineMessage({
  id: 'onboarding.pin.subtitle.simple',
  message: 'This PIN secures your wallet. You enter it every time you share data.',
  comment: 'PIN explanation in simpler flow without EID',
})

const pinReenterTitle = defineMessage({
  id: 'onboarding.pinReenter.title',
  message: 'Repeat your PIN',
  comment: 'Heading when user repeats their PIN',
})

const pinReenterSubtitle = defineMessage({
  id: 'onboarding.pinReenter.subtitle',
  message: 'This PIN secures your identity wallet. You enter it every time you share data.',
  comment: 'Explanation shown when re-entering the PIN',
})

const pinReenterSubtitleSimple = defineMessage({
  id: 'onboarding.pinReenter.subtitle.simple',
  message: 'This PIN secures your wallet. You enter it every time you share data.',
  comment: 'PIN explanation in simpler flow without EID',
})

const biometricsTitle = defineMessage({
  id: 'onboarding.biometrics.title',
  message: 'Set up biometrics',
  comment: 'Heading when user sets up biometrics',
})

const biometricsSubtitle = defineMessage({
  id: 'onboarding.biometrics.subtitle',
  message:
    'Activate the biometrics functionality of your phone to make sure only you can enter your wallet and share data.',
  comment: 'Subtitle explaining purpose of biometrics',
})

const introTitle = defineMessage({
  id: 'onboarding.intro.title',
  message: 'Set up your wallet',
  comment: 'Title for the introduction steps slide in onboarding',
})

const introSubtitle = defineMessage({
  id: 'onboarding.intro.subtitle',
  message: 'Before you can use the app, we will guide you through these steps.',
  comment: 'Subtitle for the introduction steps slide in onboarding',
})

export const onboardingSteps = useFeatureFlag('EID_CARD')
  ? ([
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
        step: 'wallet-explanation',
        alternativeFlow: false,
        progress: 0.1,
        page: {
          animation: 'delayed',
          type: 'content',
        },
        Screen: OnboardingWalletExplanation,
      },
      {
        step: 'introduction-steps',
        alternativeFlow: false,
        progress: 20,
        page: {
          animation: 'delayed',
          type: 'content',
          title: introTitle,
          subtitle: introSubtitle,
        },
        Screen: OnboardingIntroductionSteps,
      },
      {
        step: 'pin',
        alternativeFlow: false,
        progress: 30,
        page: {
          type: 'content',
          title: pinTitle,
          subtitle: pinSubtitle,
          animationKey: 'pin',
        },
        Screen: OnboardingPinEnter,
      },
      {
        step: 'pin-reenter',
        alternativeFlow: false,
        progress: 30,
        page: {
          type: 'content',
          title: pinReenterTitle,
          subtitle: pinReenterSubtitle,
          animationKey: 'pin',
        },
        Screen: OnboardingPinEnter,
      },
      {
        step: 'biometrics',
        alternativeFlow: false,
        progress: 40,
        page: {
          type: 'content',
          title: biometricsTitle,
          subtitle: biometricsSubtitle,
        },
        Screen: OnboardingBiometrics,
      },
      {
        step: 'biometrics-disabled',
        progress: 40,
        alternativeFlow: true,
        page: {
          type: 'content',
          ...pidSetupMessages.idCardBiometricsDisabled,
          animation: 'delayed',
        },
        Screen: OnboardingBiometrics,
      },
      ...pidSetupSteps,
    ] as const satisfies Array<OnboardingStep>)
  : ([
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
        step: 'pin',
        alternativeFlow: false,
        progress: 25,
        page: {
          type: 'content',
          title: pinTitle,
          subtitle: pinSubtitleSimple,
          animationKey: 'pin',
          animation: 'delayed',
        },
        Screen: OnboardingPinEnter,
      },
      {
        step: 'pin-reenter',
        alternativeFlow: false,
        progress: 25,
        page: {
          type: 'content',
          title: pinReenterTitle,
          subtitle: pinReenterSubtitleSimple,
          animationKey: 'pin',
        },
        Screen: OnboardingPinEnter,
      },
      {
        step: 'biometrics',
        alternativeFlow: false,
        progress: 50,
        page: {
          type: 'content',
          title: biometricsTitle,
          subtitle: biometricsSubtitle,
        },
        Screen: OnboardingBiometrics,
      },
      {
        step: 'biometrics-disabled',
        progress: 50,
        alternativeFlow: true,
        page: {
          type: 'content',
          ...pidSetupMessages.idCardBiometricsDisabled,
          animation: 'delayed',
        },
        Screen: OnboardingBiometrics,
      },
      {
        step: 'data-protection',
        alternativeFlow: false,
        progress: 75,
        page: {
          type: 'content',
          ...pidSetupMessages.dataProtection,
        },
        Screen: OnboardingDataProtection,
      },
    ] as const satisfies Array<OnboardingStep>)
