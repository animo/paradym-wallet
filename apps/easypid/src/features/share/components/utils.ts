export interface PresentationRequestResult {
  status: 'success' | 'error'
  result: {
    title: string
    message?: string
  }
  redirectToWallet?: boolean
}
