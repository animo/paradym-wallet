import { defineMessage } from '@lingui/core/macro'
import { _t } from '@lingui/react/macro'


const messages = {
  issueTitle: defineMessage({
    id: 'flow.issueTitle',
    message: 'Decline card?',
    comment: 'Confirmation title when declining to accept a credential (card)',
  }),
  issueDescription: defineMessage({
    id: 'flow.issueDescription',
    message: 'If you decline, you will not receive the card.',
    comment: 'Confirmation description when declining a credential offer',
  }),
  issueConfirm: defineMessage({
    id: 'flow.issueConfirmText',
    message: 'Yes, decline',
    comment: 'Confirmation button text when declining a credential offer',
  }),
  verifyTitle: defineMessage({
    id: 'flow.verifyTitle',
    message: 'Stop sharing?',
    comment: 'Confirmation title when cancelling a data sharing request',
  }),
  verifyDescription: defineMessage({
    id: 'flow.verifyDescription',
    message: 'If you stop, no data will be shared.',
    comment: 'Confirmation description when cancelling a proof request',
  }),
  verifyConfirm: defineMessage({
    id: 'flow.verifyConfirmText',
    message: 'Yes, stop',
    comment: 'Confirmation button text when stopping data sharing',
  }),
  connectTitle: defineMessage({
    id: 'flow.connectTitle',
    message: 'Stop interaction?',
    comment: 'Confirmation title when cancelling a connection offer',
  }),
  connectDescription: defineMessage({
    id: 'flow.connectDescription',
    message: 'If you stop, nothing will be saved.',
    comment: 'Confirmation description when cancelling a connection request',
  }),
  connectConfirm: defineMessage({
    id: 'flow.connectConfirmText',
    message: 'Yes, stop',
    comment: 'Confirmation button text when stopping a connection attempt',
  }),
}

export const getFlowConfirmationText = (t: typeof _t, type?: 'issue' | 'verify' | 'connect') => {
  if (!type) return undefined

  if (type === 'issue') {
    return {
      title: t(messages.issueTitle),
      description: t(messages.issueDescription),
      confirmText: t(messages.issueConfirm),
    }
  }

  if (type === 'verify') {
    return {
      title: t(messages.verifyTitle),
      description: t(messages.verifyDescription),
      confirmText: t(messages.verifyConfirm),
    }
  }

  // default = connect
  return {
    title: t(messages.connectTitle),
    description: t(messages.connectDescription),
    confirmText: t(messages.connectConfirm),
  }
}
