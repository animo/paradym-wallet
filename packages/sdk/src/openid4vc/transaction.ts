import { getFormattedTransactionData, type QtspInfo } from './transactionDataRegistry'

export type FormattedTransactionData = ReturnType<typeof getFormattedTransactionData>
export type { QtspInfo }
export { getFormattedTransactionData }
