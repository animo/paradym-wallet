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
    comment: 'Toast or message shown when an error occurred during retrieval of credentials',
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
  invitationTypeNotAllowed: defineMessage({
    id: 'common.invitationTypeNotAllowed',
    message: 'Invitation type not allowed.',
  }),
  invitationParsingFailed: defineMessage({
    id: 'common.invitationParsingFailed',
    message: 'Failed to parse invitation.',
  }),
  invitationNotSupported: defineMessage({
    id: 'common.invitationNotSupported',
    message: 'Invitation not supported.',
    comment: 'Error message shown when the type of invitation is not supported by the wallet',
  }),
  invalidInvitation: defineMessage({
    id: 'common.invalidInvitation',
    message: 'Invalid invitation.',
    comment: 'Error message shown when the invitation is not valid',
  }),
  invitationAlreadyScanned: defineMessage({
    id: 'common.invitationAlreadyScanned',
    message: 'Invitation has already been scanned.',
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
  cardPending: defineMessage({
    id: 'common.cardPending',
    message: 'Card pending',
    comment: 'Shown when the issuance of a card is pending',
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
  signingPending: defineMessage({
    id: 'common.signingPending',
    message: 'Signing pending',
    comment: 'Shown when the signing process is pending',
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
  sharingPending: defineMessage({
    id: 'common.sharingPending',
    message: 'Sharing pending',
    comment: 'Shown when the sharing process is pending',
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
  deleteDeferredCredentialTitle: defineMessage({
    id: 'common.deleteDeferredCredentialTitle',
    message: 'Delete deferred credential?',
    comment: 'Title for confirmation dialog to delete a deferred credential',
  }),
  deleteDeferredCredentialDescription: (name: string) =>
    defineMessage({
      id: 'common.deleteDeferredCredentialConfirmDescription',
      message: `By deleting ${name}, you will no longer be able to retrieve your credential from the issuer.`,
      comment: 'Description in confirmation dialog explaining deferred credential deletion',
    }),
  deleteDeferredCredentialConfirm: defineMessage({
    id: 'common.deleteCardConfirm',
    message: 'Yes, delete',
    comment: 'Confirm button text for deleting a deferred credential',
  }),
  toastDeferredCredentialDeleted: defineMessage({
    id: 'common.toastDeferredCredentialDeleted',
    message: 'Deferred credential deleted',
    comment: 'Toast message shown after successfully deleting a deferred credential',
  }),
  toastDeferredCredentialDeleteError: defineMessage({
    id: 'common.toastDeferredCredentialDeleteError',
    message: 'Error deleting deferred credential',
    comment: 'Toast message shown when deferred credential deletion failed',
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
  openSettingsButton: defineMessage({
    id: 'common.openSettingsButton',
    message: 'Open settings',
  }),
  fields: {
    place_of_birth: defineMessage({
      id: 'common.fields.placeOfBirth',
      message: 'Place of birth',
    }),
    date_of_birth: defineMessage({
      id: 'common.fields.dateOfBirth',
      message: 'Date of birth',
    }),
    address: defineMessage({
      id: 'common.fields.address',
      message: 'Address',
    }),
    nationalities: defineMessage({
      id: 'common.fields.nationalities',
      message: 'Nationalities',
    }),
    nationality: defineMessage({
      id: 'common.fields.nationality',
      message: 'Nationality',
    }),
    street: defineMessage({
      id: 'common.fields.street',
      message: 'Street',
      comment: 'The street where someone lives',
    }),
    city: defineMessage({
      id: 'common.fields.city',
      message: 'City',
      comment: 'The city where someone lives',
    }),
    country: defineMessage({
      id: 'common.fields.country',
      message: 'Country',
      comment: 'The country where someone lives',
    }),
    postal_code: defineMessage({
      id: 'common.fields.postalCode',
      message: 'Postal code',
      comment: 'The postal code where someone lives',
    }),
    age: defineMessage({
      id: 'common.fields.age',
      message: 'Age',
      comment: 'The age of a person',
    }),
    birth_year: defineMessage({
      id: 'common.fields.birthYear',
      message: 'Birth year',
      comment: 'The birth year of a person',
    }),
    age_over: defineMessage({
      id: 'common.fields.ageOver',
      message: 'Age over',
      comment: 'Used as prefix to indicate the age of a person is over a certain age.',
    }),
    family_name: defineMessage({
      id: 'common.fields.familyName',
      message: 'Family name',
      comment: 'The family name of a person.',
    }),
    given_name: defineMessage({
      id: 'common.fields.givenName',
      message: 'Given name',
      comment: 'The given name of a person.',
    }),
    portrait: defineMessage({
      id: 'common.fields.portrait',
      message: 'Portrait',
      comment: 'The portrait of a person.',
    }),
    issuing_authority: defineMessage({
      id: 'common.fields.issuingAuthority',
      message: 'Issuing authority',
      comment: 'The issuing authority of a credential',
    }),
    issuing_country: defineMessage({
      id: 'common.fields.issuingCountry',
      message: 'Issuing country',
      comment: 'The issuing country of a credential',
    }),
    issued_at: defineMessage({
      id: 'common.fields.issuedAt',
      message: 'Issued at',
      comment: 'The time at which a credential is issued',
    }),
    validFrom: defineMessage({
      id: 'common.fields.validFrom',
      message: 'Valid from',
      comment: 'The time ƒrom which a credential is valid',
    }),
    expires_at: defineMessage({
      id: 'common.fields.expiresAt',
      message: 'Expires at',
      comment: 'The time at which a credential expires',
    }),
    credentialType: defineMessage({
      id: 'common.fields.credentialType',
      message: 'Credential type',
      comment: 'The type of credential, usually a complex url structure',
    }),
    issuer: defineMessage({
      id: 'common.fields.issuer',
      message: 'Issuer',
      comment: 'The issuer identifier of a credential, usually a complex url structure',
    }),
    holder: defineMessage({
      id: 'common.fields.holder',
      message: 'Holder',
      comment: 'The holder identifier of a credential, usually a complex url structure',
    }),
    locality: defineMessage({
      id: 'common.fields.locality',
      message: 'Locality',
      comment: 'The locality of a person',
    }),
    region: defineMessage({
      id: 'common.fields.region',
      message: 'Region',
      comment: 'The region of a person',
    }),
    born: defineMessage({
      id: 'common.fields.born',
      message: 'Born',
      comment: 'Used a prefix for when a person is born',
    }),
  },
  credentials: {
    mdl: {
      driving_license: defineMessage({
        id: 'common.credentials.mdl.title',
        message: 'Driving License',
        comment: 'The title of a driving license',
      }),
      driving_privileges: defineMessage({
        id: 'common.credentials.mdl.drivingPrivileges',
        message: 'Driving privileges',
        comment: 'The title of driving privileges',
      }),
      document_number: defineMessage({
        id: 'common.credentials.mdl.documentNumber',
        message: 'Document number',
        comment: 'The document number of an mDL',
      }),
      code: defineMessage({
        id: 'common.credentials.mdl.code',
        message: 'Code',
        comment: 'The code of a driving privilege in an mDL',
      }),
      value: defineMessage({
        id: 'common.credentials.mdl.value',
        message: 'Value',
        comment: 'The value of a driving privilege in an mDL',
      }),
      sign: defineMessage({
        id: 'common.credentials.mdl.sign',
        message: 'Sign',
        comment: 'The sign of a driving privilege in an mDL (e.g. >=)',
      }),
      codes: defineMessage({
        id: 'common.credentials.mdl.codes',
        message: 'Codes',
        comment: 'The codes of a driving privilege in an mDL',
      }),
      vehicle_category_code: defineMessage({
        id: 'common.credentials.mdl.vehicleCategoryCode',
        message: 'Vehicle category code',
        comment: 'The vehicle category code of an mDL',
      }),
      un_distinguishing_sign: defineMessage({
        id: 'common.credentials.mdl.unDistinguishingSign',
        message: 'UN sign',
        comment: 'The United Nations distinguishing sign of an mDL',
      }),
      signature_usual_mark: defineMessage({
        id: 'common.credentials.mdl.signature_usual_mark',
        message: 'Signature',
        comment: 'Image of signature in an mDL',
      }),
    },
  },
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
