export const getFlowConfirmationText = (type?: 'issue' | 'verify' | 'connect') => {
  if (!type) return undefined

  if (type === 'issue') {
    return {
      title: 'Decline card?',
      description: 'If you decline, you will not receive the card.',
      confirmText: 'Yes, decline',
    }
  }
  if (type === 'verify') {
    return {
      title: 'Stop sharing?',
      description: 'If you stop, no data will be shared.',
      confirmText: 'Yes, stop',
    }
  }
  return {
    title: 'Stop interaction?',
    description: 'If you stop, nothing will be saved.',
    confirmText: 'Yes, stop',
  }
}
