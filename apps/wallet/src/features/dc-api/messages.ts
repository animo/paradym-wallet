import { defineMessage, plural } from '@lingui/core/macro'
import { commonMessages } from '@package/translations'

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
  share: commonMessages.share,
  entryCount: (count: number) =>
    defineMessage({
      id: 'dcApi.entryCount',
      comment: 'Value shown for a list the request UI does not expand, such as the categories of a driving licence.',
      message: plural(count, { one: '# entry', other: '# entries' }),
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
  requestFailed: defineMessage({
    id: 'dcApi.requestFailed',
    comment: 'Shown when the request could not be read, before the user was asked to approve anything',
    message: 'This request could not be read. Ask the verifier to make a new request and try again.',
  }),
  shareFailed: defineMessage({
    id: 'dcApi.shareFailed',
    comment: 'Shown when the card could not be shared, after the user already approved the request',
    message: 'Your card could not be shared. Ask the verifier to make a new request and try again.',
  }),
  errorReasonPrefix: commonMessages.errorReasonPrefix,
} as const
