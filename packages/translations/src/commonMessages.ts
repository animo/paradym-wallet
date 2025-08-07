import type { MessageDescriptor } from '@lingui/core'
// src/i18n/messages.ts
import { defineMessage } from '@lingui/core/macro'
import type { SupportedLocale } from './i18n'

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
  confirmStop: defineMessage({
    id: 'common.confirmStop',
    message: 'Yes, stop',
  }),
  confirmDecline: defineMessage({
    id: 'common.confirmDecline',
    message: 'Yes, decline',
  }),
  confirmContinue: defineMessage({
    id: 'common.confirmContinue',
    message: 'Yes, continue',
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
  no: defineMessage({
    id: 'common.no',
    message: 'No',
    comment: 'Generic no/deny action label',
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
  biometricAuthenticationNotEnabled: defineMessage({
    id: 'common.biometricNotEnabled',
    message: 'Biometric authentication not enabled',
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
    id: 'common.informationRequestDeclined',
    message: 'Information request has been declined.',
  }),
  featureNotSupported: defineMessage({
    id: 'common.featureNotSupported',
    message: 'This feature is not supported in this version of the app.',
    comment: 'Shown when a feature that is not supported is accessed',
  }),
  acceptButton: defineMessage({
    id: 'common.acceptButton',
    message: 'Accept',
  }),
  declineButton: defineMessage({
    id: 'common.declineButton',
    message: 'Decline',
  }),
  backButton: defineMessage({
    id: 'common.backButton',
    message: 'Back',
  }),
  unknown: defineMessage({
    id: 'common.unknown',
    message: 'Unknown',
  }),
  unknownOrganization: defineMessage({
    id: 'common.unknownOrganization',
    message: 'Unknown Organization',
  }),
  credential: defineMessage({ id: 'common.credential', message: 'Credential' }),
  dataRequest: defineMessage({
    id: 'common.dataRequest',
    message: 'Data Request',
    comment: 'Fallback title for a proof request notification',
  }),
  unableToRetrieveInvitation: defineMessage({
    id: 'common.unableToRetrieveInvitation',
    message: 'Unable to retrieve invitation.',
    comment: 'Shown when fetching an invitation from a URL fails',
  }),
  invitationNotRecognized: defineMessage({
    id: 'common.invitationNotRecognized',
    message: 'Invitation not recognized.',
    comment: 'Shown when the invitation data format is not supported or could not be parsed',
  }),
  issuedByWithName: (name: string) =>
    defineMessage({
      id: 'common.issuedByWithName',
      message: `Issued by ${name}`,
      comment: 'Label showing the name of the credential issuer, e.g. "Issued by Government of Austria"',
    }),
  cardAdded: defineMessage({
    id: 'common.cardAdded',
    message: 'Card added',
    comment: 'Shown when a card has been successfully received',
  }),
  cardRejected: defineMessage({
    id: 'common.cardRejected',
    message: 'Card rejected',
    comment: 'Shown when a received card was rejected',
  }),
  cardNotAdded: defineMessage({
    id: 'common.cardNotAdded',
    message: 'Card not added',
    comment: 'Shown when receiving a card failed',
  }),
  documentSigned: defineMessage({
    id: 'common.documentSigned',
    message: 'Document signed',
    comment: 'Shown when signing a document succeeded',
  }),
  signingStopped: defineMessage({
    id: 'common.signingStopped',
    message: 'Signing stopped',
    comment: 'Shown when the signing process was stopped',
  }),
  signingFailed: defineMessage({
    id: 'common.signingFailed',
    message: 'Signing failed',
    comment: 'Shown when the signing process failed',
  }),
  informationShared: defineMessage({
    id: 'common.informationShared',
    message: 'Information shared',
    comment: 'Shown when data was successfully shared',
  }),
  sharingStopped: defineMessage({
    id: 'common.sharingStopped',
    message: 'Sharing stopped',
    comment: 'Shown when the user stopped the data sharing process',
  }),
  sharingFailed: defineMessage({
    id: 'common.sharingFailed',
    message: 'Sharing failed',
    comment: 'Shown when data sharing failed',
  }),
  archiveCardTitle: defineMessage({
    id: 'common.archiveCardTitle',
    message: 'Archive card?',
    comment: 'Title for confirmation dialog to archive a card',
  }),
  archiveCardDescription: (name: string) =>
    defineMessage({
      id: 'common.archiveCardDescription',
      message: `This will make ${name} unusable and delete it from your wallet.`,
      comment: 'Description in confirmation dialog explaining card archiving',
    }),
  archiveCardConfirm: defineMessage({
    id: 'common.archiveCardConfirm',
    message: 'Yes, archive',
    comment: 'Confirm button text for archiving a card',
  }),
  toastCardArchived: defineMessage({
    id: 'common.toastCardArchived',
    message: 'Card successfully archived',
    comment: 'Toast message shown after successfully archiving a card',
  }),
  toastCardDeleteError: defineMessage({
    id: 'common.toastCardDeleteError',
    message: 'Error deleting card',
    comment: 'Toast message shown when card deletion failed',
  }),
  expired: defineMessage({
    id: 'common.expired',
    message: 'Expired',
    comment: 'Label shown on a credential card when it is expired',
  }),
  revoked: defineMessage({
    id: 'common.revoked',
    message: 'Revoked',
    comment: 'Label shown on a credential card when it is revoked',
  }),
  authorizationFailed: defineMessage({
    id: 'common.authorizationFailed',
    message: 'Authorization failed',
  }),
}

export const supportedLanguageMessages: Record<SupportedLocale, MessageDescriptor> = {
  nl: defineMessage({
    id: 'language.nl',
    message: 'Dutch',
  }),
  fi: defineMessage({
    id: 'language.fi',
    message: 'Finnish',
  }),
  sw: defineMessage({
    id: 'language.sw',
    message: 'Swedish',
  }),
  en: defineMessage({
    id: 'language.en',
    message: 'English',
  }),
  de: defineMessage({
    id: 'language.de',
    message: 'German',
  }),
  al: defineMessage({
    id: 'language.al',
    message: 'Albanian',
  }),
}
