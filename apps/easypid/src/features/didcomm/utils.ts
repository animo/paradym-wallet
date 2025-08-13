import { defineMessage } from '@lingui/core/macro'
import type { _t } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'

const messages = {
  issueTitle: defineMessage({
    id: 'didcommCancelFlow.issuance.title',
    message: 'Decline card?',
    comment: 'Confirmation title when declining to accept a credential (card)',
  }),
  issueDescription: defineMessage({
    id: 'didcommCancelFlow.issuance.description',
    message: 'If you decline, you will not receive the card.',
    comment: 'Confirmation description when declining a credential offer',
  }),
  verifyTitle: defineMessage({
    id: 'didcommCancelFlow.verification.title',
    message: 'Stop sharing?',
    comment: 'Confirmation title when cancelling a data sharing request',
  }),
  verifyDescription: defineMessage({
    id: 'didcommCancelFlow.verification.description',
    message: 'If you stop, no data will be shared.',
    comment: 'Confirmation description when cancelling a proof request',
  }),
  connectTitle: defineMessage({
    id: 'didcommCancelFlow.connect.title',
    message: 'Stop interaction?',
    comment: 'Confirmation title when cancelling a connection offer',
  }),
  connectDescription: defineMessage({
    id: 'didcommCancelFlow.connect.description',
    message: 'If you stop, nothing will be saved.',
    comment: 'Confirmation description when cancelling a connection request',
  }),
}

export const getFlowConfirmationText = (t: typeof _t, type?: 'issue' | 'verify' | 'connect') => {
  if (!type) return undefined

  if (type === 'issue') {
    return {
      title: t(messages.issueTitle),
      description: t(messages.issueDescription),
      confirmText: t(commonMessages.confirmDecline),
    }
  }

  if (type === 'verify') {
    return {
      title: t(messages.verifyTitle),
      description: t(messages.verifyDescription),
      confirmText: t(commonMessages.confirmStop),
    }
  }

  // default = connect
  return {
    title: t(messages.connectTitle),
    description: t(messages.connectDescription),
    confirmText: t(commonMessages.confirmStop),
  }
}
