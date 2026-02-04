import { sendErrorResponse } from '@animo-id/expo-digital-credentials-api'

export async function dcApisendErrorResponse(errorMessage: string) {
  sendErrorResponse({
    errorMessage,
  })
}
