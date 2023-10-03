import {
  isOpenIdCredentialOffer,
  isOpenIdPresentationRequest,
  receiveOutOfBandInvitation,
  tryParseDidCommInvitation,
  useAgent,
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
  const { agent } = useAgent()

  const handleCredentialData = async (dataUrl: string): Promise<CredentialDataOutputResult> => {
    if (isOpenIdCredentialOffer(dataUrl)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/openIdCredential',
        query: {
          uri: encodeURIComponent(dataUrl),
        },
      })

      return {
        result: 'success',
      }
    } else if (isOpenIdPresentationRequest(dataUrl)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      push({
        pathname: '/notifications/openIdPresentation',
        query: {
          uri: encodeURIComponent(dataUrl),
        },
      })

      return {
        result: 'success',
      }
    }

    // If it is not an OpenID invitation, we assume the data is a DIDComm invitation.
    // We can't know for sure, as it could be a shortened URL to a DIDComm invitation.
    // So we use the parseMessage from AFJ and see if this returns a valid message.
    // Parse invitation supports legacy connection invitations, oob invitations, and
    // legacy connectionless invitations, and will all transform them into an OOB invitation.
    const invitation = await tryParseDidCommInvitation(agent, dataUrl)

    if (invitation) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const result = await receiveOutOfBandInvitation(agent, invitation)

      // Error
      if (result.result === 'error') {
        return result
      }

      // Credential exchange
      if ('credentialExchangeId' in result) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        push({
          pathname: '/notifications/didCommCredential',
          query: {
            credentialExchangeId: result.credentialExchangeId,
          },
        })

        return { result: 'success' }
      }
      // Proof Exchange
      else if ('proofExchangeId' in result) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        push({
          pathname: '/notifications/didCommPresentation',
          query: {
            proofExchangeId: result.proofExchangeId,
          },
        })

        return { result: 'success' }
      }
    }

    return {
      result: 'error',
      message: 'QR Code not recognized.',
    }
  }

  return {
    handleCredentialData,
  }
}
