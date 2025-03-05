import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { type OnboardingStep, pidSetupSteps } from '@easypid/utils/sharedPidSetup'
import { OnboardingBiometrics } from './screens/biometrics'
import { OnboardingDataProtection } from './screens/data-protection'
import { OnboardingIntroductionSteps } from './screens/introduction-steps'
import OnboardingPinEnter from './screens/pin'
import { OnboardingWalletExplanation } from './screens/wallet-explanation'
import OnboardingWelcome from './screens/welcome'

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
          title: '',
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
          title: 'Set up your wallet',
          subtitle: 'Before you can use the app, we will guide you through these steps.',
        },
        Screen: OnboardingIntroductionSteps,
      },

      {
        step: 'pin',
        alternativeFlow: false,
        progress: 30,
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
        progress: 30,
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
        progress: 40,
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
        progress: 40,
        alternativeFlow: true,
        page: {
          type: 'content',
          title: 'You need to enable biometrics',
          subtitle:
            'To continue, make sure your device has biometric protection enabled, and that Paradym Wallet is allowed to use biometrics.',
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
          title: 'Choose a 6-digit PIN',
          subtitle: 'This PIN secures your wallet. You enter it every time you share data.',
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
          title: 'Repeat your PIN',
          subtitle: 'This PIN secures your wallet. You enter it every time you share data.',
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
          title: 'Set up biometrics',
          subtitle:
            'Activate the biometrics functionality of your phone to make sure only you can enter your wallet and share data.',
        },
        Screen: OnboardingBiometrics,
      },
      {
        step: 'biometrics-disabled',
        progress: 50,
        alternativeFlow: true,
        page: {
          type: 'content',
          title: 'You need to enable biometrics',
          animation: 'delayed',
          subtitle:
            'To continue, make sure your device has biometric protection enabled, and that Paradym Wallet is allowed to use biometrics.',
        },
        Screen: OnboardingBiometrics,
      },
      {
        step: 'data-protection',
        alternativeFlow: false,
        progress: 75,
        page: {
          type: 'content',
          title: 'Protect your data',
          subtitle:
            'Your data is secured with a PIN and biometrics. Each time you share data, we confirm your identity.',
        },
        Screen: OnboardingDataProtection,
      },
    ] as const satisfies Array<OnboardingStep>)
