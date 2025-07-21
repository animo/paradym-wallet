// src/i18n/messages.ts
import { defineMessage } from '@lingui/core/macro'

export const commonMessages = {
  stop: defineMessage({
    id: 'common.stop',
    message: 'Stop',
    comment: 'Label for stop/decline action',
  }),
  close: defineMessage({
    id: 'common.close',
    message: 'Close',
    comment: 'Label for closing a screen or modal',
  }),
  continue: defineMessage({
    id: 'common.continue',
    message: 'Continue',
    comment: 'Generic continue/next action label',
  }),
  goToWallet: defineMessage({
    id: 'common.goToWallet',
    message: 'Go to wallet',
    comment: 'Button label to return to the wallet',
  }),
  goToSettings: defineMessage({
    id: 'common.goToSettings',
    message: 'Go to settings',
    comment: 'Button label to open device settings',
  }),
  success: defineMessage({
    id: 'common.success',
    message: 'Success!',
    comment: 'Title shown when an action completes successfully',
  }),

  reset: defineMessage({
    id: 'common.reset',
    message: 'Reset Wallet',
    comment: 'Button label or title to reset the wallet',
  }),
  cancel: defineMessage({
    id: 'common.cancel',
    message: 'Cancel',
    comment: 'Generic cancel action label',
  }),
  yes: defineMessage({
    id: 'common.yes',
    message: 'Yes',
    comment: 'Generic yes/confirm action label',
  }),

  enterPin: defineMessage({
    id: 'common.enterPin',
    message: 'Enter your app PIN code',
    comment: 'Heading prompting the user to enter their PIN code',
  }),
  invalidPinEntered: defineMessage({
    id: 'common.invalidPinEntered',
    message: 'Invalid PIN entered',
    comment: 'Shown when invalid PIN is entered',
  }),
  enterPinToShareData: defineMessage({
    id: 'common.enterPinToShareData',
    message: 'Enter PIN to share data',
    comment: 'Heading prompting the user to enter their PIN code before sharing data',
  }),
  confirmResetWallet: defineMessage({
    id: 'common.confirmResetWallet',
    message: 'Are you sure you want to reset the wallet?',
    comment: 'Confirmation prompt before wallet reset',
  }),
  credentialInformationCouldNotBeExtracted: defineMessage({
    id: 'common.credentialInformationCouldNotBeExtracted',
    message: 'Credential information could not be extracted',
    comment: 'Toast or message shown when a credential offer could not be parsed correctly',
  }),
  errorWhileRetrievingCredentials: defineMessage({
    id: 'common.errorWhileRetrievingCredentials',
    message: 'Error while retrieving credentials',
    comment: 'Toast or message shown when an error ocurred during retrieval of credentials',
  }),
  presentationInformationCouldNotBeExtracted: defineMessage({
    id: 'common.presentationInformationCouldNotBeExtracted',
    message: 'Presentation information could not be extracted',
    comment: 'Toast or message shown when a presentation request could not be parsed correctly',
  }),
  presentationCouldNotBeShared: defineMessage({
    id: 'common.presentationCouldNotBeShared',
    message: 'Presentation could not be shared.',
    comment: 'Toast or message shown when a presentation could not be shared',
  }),
  presentationShared: defineMessage({
    id: 'common.presentationShared',
    message: 'Information has been successfully shared.',
    comment: 'Toast or message shown when a presentation was successfully shared',
  }),
  biometricAuthenticationCancelled: defineMessage({
    id: 'common.biometricCancelled',
    message: 'Biometric authentication cancelled',
    comment: 'Shown when the user cancels biometric authentication',
  }),
  simulatorEidCardActivated: defineMessage({
    id: 'common.simulatorEidCardActivated',
    message: 'Simulator eID card activated',
  }),
  pleaseTryAgain: defineMessage({
    id: 'common.pleaseTryAgain',
    message: 'Please try again',
    comment: 'Shown when an action should be retried.',
  }),
  somethingWentWrong: defineMessage({
    id: 'common.somethingWentWrong',
    message: 'Something went wrong',
    comment: 'General title/message shown when something went wrong',
  }),
  informationRequestDeclined: defineMessage({
    id: 'common.informationRequestDeclinded',
    message: 'Information request has been declined.',
  }),
}
