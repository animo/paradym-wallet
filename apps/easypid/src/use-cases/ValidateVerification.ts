const PLAYGROUND_URL = 'https://funke.animo.id'

export const EXCLUDED_ATTRIBUTES_FOR_ANALYSIS = ['Issuing authority', 'Issuing country', 'Issued at', 'Expires at']

export type VerificationAnalysisInput = {
  verifier: {
    name: string
    domain: string
  }
  name: string
  purpose: string
  cards: Array<{
    name: string
    subtitle: string
    requestedAttributes: Array<string>
  }>
}

export type OverAskingResponse = {
  validRequest: 'yes' | 'no' | 'could_not_determine'
  reason: string
}

export type VerificationAnalysisResult = {
  isLoading: boolean
  result: OverAskingResponse | undefined
}

export const analyzeVerification = async ({
  verifier,
  name,
  purpose,
  cards,
}: VerificationAnalysisInput): Promise<OverAskingResponse> => {
  try {
    const cardsWithoutExcludedAttributes = cards.map((card) => ({
      ...card,
      requestedAttributes: card.requestedAttributes.filter((attr) => !EXCLUDED_ATTRIBUTES_FOR_ANALYSIS.includes(attr)),
    }))

    const response = await fetch(`${PLAYGROUND_URL}/api/validate-verification-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verifier, name, purpose, cards: cardsWithoutExcludedAttributes }),
    })

    if (!response.ok) {
      throw new Error(`Request to AI returned ${response.status}`)
    }

    const data = await response.json()

    console.debug(
      'AI analysed verification request and returned the following response:',
      JSON.stringify(data, null, 2)
    )

    return data
  } catch (error) {
    console.error('AI analysis failed:', error)
    return {
      validRequest: 'could_not_determine',
      reason: 'An error occurred while validating the verification',
    }
  }
}
