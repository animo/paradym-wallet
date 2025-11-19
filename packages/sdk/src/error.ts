import { cancelMessages, notEnabledMessages } from './error/biometrics'

export class ParadymWalletSdkError extends Error {
  constructor(message: string = new.target.name) {
    super(message)
  }
}

export class ParadymWalletMustBeDidCommAgentError extends ParadymWalletSdkError {}
export class ParadymWalletMustBeOpenId4VcAgentError extends ParadymWalletSdkError {}
export class ParadymWalletMustBeInitializedError extends ParadymWalletSdkError {}

export class ParadymWalletUnsupportedCredentialRecordTypeError extends ParadymWalletSdkError {}

export class ParadymWalletNoMediatorDidProvidedError extends ParadymWalletSdkError {}

export class ParadymWalletInvitationError extends ParadymWalletSdkError {}
export class ParadymWalletInvitationReceiveError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationMultipleRequestsError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationNotRecognizedError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationParseError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationRetrievalError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationDidcommHandlerMustBeDefinedError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationAlreadyUsedError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationDidcommUnsupportedProtocolError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationOpenIdCredentialHandlerMustBeDefinedError extends ParadymWalletInvitationError {}
export class ParadymWalletInvitationOpenIdAuthorizationRequestHandlerMustBeDefinedError extends ParadymWalletInvitationError {}

export class ParadymWalletNoRequestToResolveError extends ParadymWalletInvitationError {}

export class ParadymWalletInvalidTrustMechnismError extends ParadymWalletSdkError {}

export class ParadymWalletBiometricAuthenticationError extends ParadymWalletSdkError {
  public static tryParseFromError(error: unknown): ParadymWalletBiometricAuthenticationError | null {
    if (ParadymWalletBiometricAuthenticationCancelledError.isBiometricAuthenticationCancelledError(error)) {
      return new ParadymWalletBiometricAuthenticationCancelledError()
    }

    if (ParadymWalletBiometricAuthenticationNotEnabledError.isBiometricAuthenticationNotEnabledError(error)) {
      return new ParadymWalletBiometricAuthenticationNotEnabledError()
    }

    return null
  }
}

export class ParadymWalletBiometricAuthenticationCancelledError extends ParadymWalletBiometricAuthenticationError {
  public static isBiometricAuthenticationCancelledError(error: unknown) {
    return error instanceof Error && cancelMessages.some((m) => error.message.toLowerCase().includes(m))
  }
}

export class ParadymWalletBiometricAuthenticationNotEnabledError extends ParadymWalletBiometricAuthenticationError {
  public static isBiometricAuthenticationNotEnabledError(error: unknown) {
    return error instanceof Error && notEnabledMessages.some((m) => error.message.toLowerCase().includes(m))
  }
}
