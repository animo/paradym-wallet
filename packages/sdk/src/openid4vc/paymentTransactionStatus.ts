import { getTransactionStatusMetadata } from '../metadata/credentials'
import type { PaymentTransactionStatusCode } from '../storage/activityStore'
import type { CredentialRecord } from '../storage/credentials'

export const fetchPaymentTransactionStatus = async (
  credentialRecord: CredentialRecord,
  transactionHash: string
): Promise<PaymentTransactionStatusCode | undefined> => {
  const metadata = getTransactionStatusMetadata(credentialRecord)?.['urn:eudi:sca:eu.europa.ec:payment']
  if (!metadata) return undefined

  const { transaction_status_token: token, transaction_status_url: url } = metadata

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `transaction=${transactionHash}`,
    })
    const body = (await response.json()) as { status_code?: PaymentTransactionStatusCode }
    return body.status_code
  } catch {
    return undefined
  }
}
