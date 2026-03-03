import { type OnboardingStep, pidSetupMessages } from '@easypid/utils/sharedPidSetup'
import { defineMessage } from '@lingui/core/macro'
import { OnboardingBiometrics } from './screens/biometrics'
import { OnboardingDataProtection } from './screens/data-protection'
import OnboardingPinEnter from './screens/pin'
import OnboardingWelcome from './screens/welcome'

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

const pinReenterTitle = defineMessage({
  id: 'onboarding.pinReenter.title',
  message: 'Repeat your PIN',
  comment: 'Heading when user repeats their PIN',
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
    step: 'pin',
    alternativeFlow: false,
    progress: 25,
    page: {
      type: 'content',
      title: pinTitle,
      subtitle: pinSubtitle,
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
      subtitle: pinSubtitle,
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
] as const satisfies Array<OnboardingStep>
