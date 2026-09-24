// src/i18n/messages.ts
import { defineMessage } from '@lingui/core/macro'
import type { SupportedLocale } from './i18n'

export const commonMessages = {
  showLess: defineMessage({
    id: 'common.showLess',
    message: 'Show less',
  }),
  showMore: defineMessage({
    id: 'common.showMore',
    message: 'Show more',
  }),
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
  setUpLater: defineMessage({
    id: 'common.setUpLater',
    message: 'Set up later',
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
  pinRequiredToAcceptPresentation: defineMessage({
    id: 'common.pinRequiredToAcceptPresentation',
    message: 'PIN is required to accept the presentation.',
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
  biometricAuthenticationDisabled: defineMessage({
    id: 'common.biometricDisabled',
    message: 'Biometric authentication disabled',
    comment: 'Shown as toast when the user disabled biometric authentication',
  }),
  biometricAuthenticationNotEnabled: defineMessage({
    id: 'common.biometricNotEnabled',
    message: 'Biometric authentication not enabled',
  }),
  biometricAuthenticationEnabled: defineMessage({
    id: 'common.biometricEnabled',
    message: 'Biometric authentication enabled',
    comment: 'Shown as toast when the user enabled biometric authentication',
  }),
  biometricAuthenticationMustBeEnabledInSettings: defineMessage({
    id: 'common.biometricAuthenticationMustBeEnabledInSettings',
    message: 'Biometric authentication not configured, enable biometrics in the settings of your device',
  }),
  errorChangingBiometrics: defineMessage({
    id: 'common.errorEnablingBiometrics',
    message: 'An unknown error occurred while changing the biometric authentication settings.',
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
  missingAttributesHeading: defineMessage({
    id: 'common.missingAttributesHeading',
    message: 'MISSING ATTRIBUTES',
    comment: 'Heading shown above requested cards the user has, but that lack some of the requested attributes',
  }),
  missingAttributesDescription: defineMessage({
    id: 'common.missingAttributesDescription',
    message: 'Some of your cards are missing requested attributes. These are marked in red.',
    comment: 'Description when the user has the requested cards, but some lack requested attributes',
  }),
  mismatchedAttributesHeading: defineMessage({
    id: 'common.mismatchedAttributesHeading',
    message: `ATTRIBUTES DON'T MATCH`,
    comment:
      'Heading shown above requested cards the user has, but that hold some of the requested attributes with a value the request does not accept',
  }),
  mismatchedAttributesDescription: defineMessage({
    id: 'common.mismatchedAttributesDescription',
    message: `Some attributes of your cards don't have the requested value. These are marked in red.`,
    comment:
      'Description when the user has the requested cards, but some hold requested attributes with a value the request does not accept',
  }),
  mismatchedAttributesWarning: defineMessage({
    id: 'common.mismatchedAttributesWarning',
    message: `Your cards don't have the requested values`,
    comment:
      'Shown above the close button when the user has the required cards, but they hold requested attributes with a value the request does not accept',
  }),
  unmetAttributesHeading: defineMessage({
    id: 'common.unmetAttributesHeading',
    message: `ATTRIBUTES DON'T MEET THE REQUEST`,
    comment:
      'Heading shown above requested cards the user has, but that lack some requested attributes and hold others with a value the request does not accept',
  }),
  unmetAttributesDescription: defineMessage({
    id: 'common.unmetAttributesDescription',
    message: `Some of your cards are missing requested attributes or don't have the requested value. These are marked in red.`,
    comment:
      'Description when the user has the requested cards, but some lack requested attributes and some hold requested attributes with a value the request does not accept',
  }),
  unmetAttributesWarning: defineMessage({
    id: 'common.unmetAttributesWarning',
    message: `Your cards are missing required attributes or don't have the requested values`,
    comment:
      'Shown above the close button when the user has the required cards, but they lack requested attributes and hold others with a value the request does not accept',
  }),
  missingCardsWarning: defineMessage({
    id: 'common.missingCardsWarning',
    message: `You don't have the required cards`,
    comment: 'Shown above the close button when the user lacks the required credentials',
  }),
  missingAttributesWarning: defineMessage({
    id: 'common.missingAttributesWarning',
    message: 'Your cards are missing required attributes',
    comment: 'Shown above the close button when the user has the required cards, but they lack requested attributes',
  }),
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
  invitationResolvedParameterMissing: defineMessage({
    id: 'common.invitationResolvedParameterMissing',
    message: 'Resolved parameter is missing, but required for accepting an invitation.',
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
  paid: defineMessage({
    id: 'common.paid',
    message: 'Payment is successful',
    comment: 'Shown when a payment is successful',
  }),
  paymentStopped: defineMessage({
    id: 'common.paymentStopped',
    message: 'Payment stopped',
    comment: 'Shown when a payment is stopped',
  }),
  paymentFailed: defineMessage({
    id: 'common.paymentFailed',
    message: 'Payment failed',
    comment: 'Shown when a payment is failed',
  }),
  paymentPending: defineMessage({
    id: 'common.paymentPending',
    message: 'Payment is pending',
    comment: 'Shown when a payment is pending settlement on the bank side',
  }),
  paymentRejected: defineMessage({
    id: 'common.paymentRejected',
    message: 'Payment is rejected',
    comment: 'Shown when a payment was rejected by the bank',
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
  deleteDeferredCredentialTitle: defineMessage({
    id: 'common.deleteDeferredCredentialTitle',
    message: 'Delete pending card?',
    comment: 'Title for confirmation dialog to delete a pending card',
  }),
  deleteDeferredCredentialDescription: (name: string) =>
    defineMessage({
      id: 'common.deleteDeferredCredentialDescription',
      message: `By deleting ${name}, you will no longer be able to retrieve your card from the issuer.`,
      comment: 'Description in confirmation dialog explaining pending card deletion',
    }),
  deleteDeferredCredentialConfirm: defineMessage({
    id: 'common.deleteDeferredCredentialConfirm',
    message: 'Yes, delete',
    comment: 'Confirm button text for deleting a pending card',
  }),
  toastDeferredCredentialDeleted: defineMessage({
    id: 'common.toastDeferredCredentialDeleted',
    message: 'Pending card deleted',
    comment: 'Toast message shown after successfully deleting a pending card',
  }),
  toastDeferredCredentialDeleteError: defineMessage({
    id: 'common.toastDeferredCredentialDeleteError',
    message: 'Error deleting pending card',
    comment: 'Toast message shown when pending card deletion failed',
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
  authorizationCancelled: defineMessage({
    id: 'common.authorizationCancelled',
    message: 'Authorization cancelled',
  }),
  openSettingsButton: defineMessage({
    id: 'common.openSettingsButton',
    message: 'Open settings',
  }),

  // Reviewing a request. Shared between every way a request reaches the wallet — a link, a QR code,
  // proximity, the credential picker — so they all say the same thing.
  reviewRequestTitle: defineMessage({
    id: 'common.reviewRequestTitle',
    message: 'Review the request',
    comment: 'Main heading of the screen where the user reviews a request to share, sign or pay',
  }),
  share: defineMessage({
    id: 'common.share',
    message: 'Share',
    comment: 'Button label to accept a request and share the requested cards',
  }),
  noPurposeProvided: defineMessage({
    id: 'common.noPurposeProvided',
    message: 'No information was provided on the purpose of the data request. Be cautious',
    comment: 'Shown in place of the purpose when a data request does not state one',
  }),
  requestedCardsHeading: defineMessage({
    id: 'common.requestedCardsHeading',
    message: 'REQUESTED CARDS',
    comment: 'Heading shown above a list of requested cards the user has',
  }),
  unavailableCardsHeading: defineMessage({
    id: 'common.unavailableCardsHeading',
    message: 'UNAVAILABLE CARDS',
    comment: 'Heading shown above a list of requested cards the user does not have',
  }),
  allRequestedCardsDescription: defineMessage({
    id: 'common.allRequestedCardsDescription',
    message: 'The following cards will be shared.',
    comment: 'Description when the user has all requested cards',
  }),
  noRequestedCardsDescription: defineMessage({
    id: 'common.noRequestedCardsDescription',
    message: `You don't have the requested card(s).`,
    comment: 'Description when the user has none of the requested cards',
  }),
  someRequestedCardsMissingDescription: defineMessage({
    id: 'common.someRequestedCardsMissingDescription',
    message: `You don't have all of the requested cards.`,
    comment: 'Description when the user has some but not all requested cards',
  }),
  documentHeading: defineMessage({
    id: 'common.documentHeading',
    message: 'Document',
    comment: 'Section heading above a document that is, or was, signed',
  }),
  paymentHeading: defineMessage({
    id: 'common.paymentHeading',
    message: 'Payment',
    comment: 'Section heading above a payment that is, or was, authorized',
  }),
  stopSharingTitle: defineMessage({
    id: 'common.stopSharingTitle',
    message: 'Stop sharing?',
    comment: 'Title of the confirmation dialog shown when the user stops a data sharing request',
  }),
  stopSharingDescription: defineMessage({
    id: 'common.stopSharingDescription',
    message: 'If you stop, no data will be shared.',
    comment: 'Description in the confirmation dialog shown when the user stops a data sharing request',
  }),
  errorReasonPrefix: defineMessage({
    id: 'common.errorReasonPrefix',
    message: 'Reason:',
    comment: 'Label before the underlying error message',
  }),

  // Who is asking: the trust established for the verifier or issuer of a request.
  doYouTrust: (name: string) =>
    defineMessage({
      id: 'common.doYouTrust',
      message: `Do you trust ${name}?`,
      comment: 'Heading above the organization behind a request',
    }),
  recognizedOrganization: defineMessage({
    id: 'common.recognizedOrganization',
    message: 'Recognized organization',
    comment: 'Shown when the organization behind a request is recognized by a trusted party',
  }),
  organizationNotVerifiedHeading: defineMessage({
    id: 'common.organizationNotVerifiedHeading',
    message: 'Organization not verified',
    comment: 'Heading shown when the organization behind a request could not be verified',
  }),
  organizationNotVerifiedDescription: defineMessage({
    id: 'common.organizationNotVerifiedDescription',
    message: 'Organization is not verified',
    comment: 'Description shown when the organization behind a request could not be verified',
  }),
  approvedByOneOrganization: defineMessage({
    id: 'common.approvedByOneOrganization',
    message: 'Approved by one organization',
    comment: 'Shown when one trusted organization approved the organization behind a request',
  }),
  approvedByOrganizations: (count: number) =>
    defineMessage({
      id: 'common.approvedByOrganizations',
      message: `Approved by ${count} organizations`,
      comment: 'Shown when several trusted organizations approved the organization behind a request',
    }),
  demoOrganization: defineMessage({
    id: 'common.demoOrganization',
    message: 'Demo organization',
    comment: 'Shown to indicate that an organization is a demo',
  }),
  demoOrganizationWarning: defineMessage({
    id: 'common.demoOrganizationWarning',
    message: 'Do not share real data',
    comment: 'Warning shown with a demo organization',
  }),

  // Cards and their attributes.
  credentialNotFound: defineMessage({
    id: 'common.credentialNotFound',
    message: 'Credential not found',
    comment: 'Shown if a credential is missing or cannot be loaded',
  }),
  metadataHeading: defineMessage({
    id: 'common.metadataHeading',
    message: 'Metadata',
    comment: 'Section heading for the metadata attributes of a card',
  }),
  showMetadataAttributes: defineMessage({
    id: 'common.showMetadataAttributes',
    message: 'Show metadata attributes',
    comment: 'Option that shows the metadata attributes of a card',
  }),
  hideMetadataAttributes: defineMessage({
    id: 'common.hideMetadataAttributes',
    message: 'Hide metadata attributes',
    comment: 'Option that hides the metadata attributes of a card',
  }),
  placeDeviceOnIdCard: defineMessage({
    id: 'common.placeDeviceOnIdCard',
    message: 'Place your device on top of your eID card to scan it.',
    comment: 'Instruction shown when the eID card is about to be scanned with NFC',
  }),

  // Screen names, used both as the screen title and wherever the screen is linked to.
  activity: defineMessage({
    id: 'common.activity',
    message: 'Activity',
    comment: 'Name of the activity screen, listing shared and received cards',
  }),
  cards: defineMessage({
    id: 'common.cards',
    message: 'Cards',
    comment: 'Name of the screen listing the cards in the wallet, and heading above a list of cards',
  }),
  settings: defineMessage({
    id: 'common.settings',
    message: 'Settings',
    comment: 'Name of the settings screen',
  }),

  // Empty states and onboarding.
  getStarted: defineMessage({
    id: 'common.getStarted',
    message: 'Get Started',
    comment: 'Button label to begin or finish onboarding',
  }),
  thisIsYourWallet: defineMessage({
    id: 'common.thisIsYourWallet',
    message: 'This is your wallet',
    comment: 'Heading introducing the wallet, in onboarding and on the empty wallet screen',
  }),
  nothingHereYet: defineMessage({
    id: 'common.nothingHereYet',
    message: `There's nothing here, yet`,
    comment: 'Heading shown when a list, such as the cards or the activity, is still empty',
  }),
  noNotificationsTitle: defineMessage({
    id: 'common.noNotificationsTitle',
    message: `You're all caught up`,
    comment: 'Heading shown when the user has no notifications',
  }),
  noNotificationsDescription: defineMessage({
    id: 'common.noNotificationsDescription',
    message: `You don't have any notifications at the moment.`,
    comment: 'Message shown when the user has no notifications',
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

// We always display each language by its own native name (e.g. "Nederlands" in
// every locale) so it's recognizable regardless of the active language. This
// also means the language names don't need to be translated.
export const supportedLanguageNames: Record<SupportedLocale, string> = {
  nl: 'Nederlands',
  fi: 'Suomi',
  sv: 'Svenska',
  en: 'English',
  de: 'Deutsch',
  sq: 'Shqip',
  pt: 'Português',
}
