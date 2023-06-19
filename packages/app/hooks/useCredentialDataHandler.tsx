import { isOpenIdCredentialOffer, isOpenIdPresentationRequest } from '@internal/agent'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'solito/router'

type CredentialDataOutputResult =
  | {
      result: 'success'
    }
  | {
      result: 'error'
      message: string
    }

export const useCredentialDataHandler = () => {
  const { push } = useRouter()

  const handleCredentialData = (deeplinkData: string): CredentialDataOutputResult => {
    if (isOpenIdCredentialOffer(deeplinkData)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/credential',
        query: {
          uri: encodeURIComponent(deeplinkData),
        },
      })

      return {
        result: 'success',
      }
    } else if (isOpenIdPresentationRequest(deeplinkData)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/presentation',
        query: {
          uri: encodeURIComponent(JSON.stringify(deeplinkData)),
        },
      })

      return {
        result: 'success',
      }
    }

    return {
      result: 'error',
      message: 'Schema not supported.',
    }
  }

  return {
    handleCredentialData,
  }
}
