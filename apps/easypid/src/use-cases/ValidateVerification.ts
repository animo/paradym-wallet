const PLAYGROUND_URL = 'https://3a9c-84-241-196-229.ngrok-free.app'

export type VerificationAnalysisInput = {
  name: string
  purpose: string
  cards: Array<{
    name: string
    subtitle: string
    requestedAttributes: Array<string>
  }>
}

export type VerificationAnalysisResponse = {
  validRequest: 'yes' | 'no' | 'could_not_determine'
  reason: string
}

export type VerificationAnalysisResult = {
  isLoading: boolean
  result: VerificationAnalysisResponse | undefined
}

export const analyzeVerification = async ({
  name,
  purpose,
  cards,
}: VerificationAnalysisInput): Promise<VerificationAnalysisResponse> => {
  try {
    const response = await fetch(`${PLAYGROUND_URL}/api/validate-verification-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, purpose, cards }),
    })

    if (!response.ok) {
      throw new Error(`Request to AI returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('AI analysis failed:', error)
    return {
      validRequest: 'could_not_determine',
      reason: 'An error occurred while validating the verification',
    }
  }
}
