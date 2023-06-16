import {
  isOpenIdCredentialOffer,
  isOpenIdPresentationRequest,
  parsePresentationFromOpenId,
} from '@internal/agent'
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

  const handleCredentialData = async (
    credentialData: string
  ): Promise<CredentialDataOutputResult> => {
    if (isOpenIdCredentialOffer(credentialData)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/credential',
        query: {
          uri: encodeURIComponent(credentialData),
        },
      })

      return {
        result: 'success',
      }
    } else if (isOpenIdPresentationRequest(credentialData)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const presentationDefinition = await parsePresentationFromOpenId({ data: credentialData })
      push({
        pathname: '/notifications/presentation',
        query: {
          uri: encodeURIComponent(JSON.stringify(presentationDefinition)),
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
