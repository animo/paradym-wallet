import { defineMessage } from '@lingui/core/macro'

/**
 * Strings only the credential request UI uses. Everything it shares with the app comes from
 * `commonMessages`, so there is one catalog for both.
 */
export const dcApiMessages = {
  unlockTitle: defineMessage({
    id: 'dcApi.unlockTitle',
    message: 'Unlock your wallet',
  }),
  unlockSubtitle: (origin: string) =>
    defineMessage({
      id: 'dcApi.unlockSubtitle',
      comment: 'Shown while the wallet is locked, before it can say what is being asked for',
      message: `Unlock to see what ${origin} is asking for`,
    }),
  biometricsUnavailable: defineMessage({
    id: 'dcApi.biometricsUnavailable',
    message: 'Biometric unlock is not set up. Enter your PIN instead.',
  }),
  share: defineMessage({
    id: 'dcApi.share',
    message: 'Share',
  }),
  nothingRequested: defineMessage({
    id: 'dcApi.nothingRequested',
    message: 'The request asks for no documents.',
  }),
  openWalletFirst: defineMessage({
    id: 'dcApi.openWalletFirst',
    message: 'Open the wallet app once before sharing from it.',
  }),
  declined: defineMessage({
    id: 'dcApi.declined',
    comment: 'Reason passed to the OS when the user declines; not shown to the user',
    message: 'The request was declined',
  }),
  shareFailed: defineMessage({
    id: 'dcApi.shareFailed',
    comment: 'Shown when the card could not be shared, after the user already approved the request',
    message: 'Your card could not be shared. Ask the verifier to make a new request and try again.',
  }),
  errorReasonPrefix: defineMessage({
    id: 'dcApi.errorReasonPrefix',
    comment: 'Label before the underlying error, only shown with development mode enabled',
    message: 'Reason:',
  }),
} as const
