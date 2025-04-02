import type { SlideStep } from '@package/app/src'
import { ConnectionSuccessSlide } from './ConnectionSuccessSlide'

interface DidCommConnectionSlidesProps {
  name: string
  onCancel: () => void
  onComplete: () => void
}

export function useDidCommConnectionNotificationSlides({ name, onComplete, onCancel }: DidCommConnectionSlidesProps) {
  return [
    {
      step: 'success',
      progress: 100,
      backIsCancel: true,
      screen: <ConnectionSuccessSlide key="verify-issuer" name={name} onComplete={onComplete} />,
    },
  ] as SlideStep[]
}
