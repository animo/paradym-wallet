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
}
