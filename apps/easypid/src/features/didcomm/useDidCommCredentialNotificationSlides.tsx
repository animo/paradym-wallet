import type { SlideStep } from '@package/app/src'

interface DidCommCredentialNotificationSlidesProps {
  credentialExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function useDidCommCredentialNotificationSlides({
  credentialExchangeId,
  onCancel,
  onComplete,
}: DidCommCredentialNotificationSlidesProps) {
  return [] as SlideStep[]
}
