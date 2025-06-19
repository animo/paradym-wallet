export class ParadymWalletSdkError extends Error {
  constructor(message: string = new.target.name) {
    super(message)
  }
}

export class ParadymWalletMustBeDidCommAgentError extends ParadymWalletSdkError {}
export class ParadymWalletMustBeOpenId4VcAgentError extends ParadymWalletSdkError {}
export class ParadymWalletMustBeInitializedError extends ParadymWalletSdkError {}
