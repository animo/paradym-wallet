import { useEffect, useState } from 'react'

import { useLLM } from '@easypid/llm/useLLM'
import type { OverAskingResponse, VerificationAnalysisInput } from '@easypid/use-cases/ValidateVerification'
import { analyzeVerification as analyzeVerificationApi } from '@easypid/use-cases/ValidateVerification'

// todos: add a timeout to both api and local calls

const fallbackResponse: OverAskingResponse = {
  validRequest: 'could_not_determine',
  reason: 'Error determining if the request is valid.',
}

export function useOverAskingAi() {
  const [isProcessingOverAsking, setIsProcessingOverAsking] = useState(false)
  const [overAskingResponse, setOverAskingResponse] = useState<OverAskingResponse>()

  const { generate, response, error, isModelReady, isModelGenerating } = useLLM()

  useEffect(() => {
    console.log('response', response)
  }, [response])

  useEffect(() => {
    if (error) {
      console.error('Error generating using LLM:', error)
      setIsProcessingOverAsking(false)
      setOverAskingResponse(fallbackResponse)
      return
    }

    if (!response || isModelGenerating) return

    try {
      const result = formatResult(response)
      setOverAskingResponse(result)
    } catch (e) {
      console.error('Error parsing AI response:', e)
      setOverAskingResponse(fallbackResponse)
      setIsProcessingOverAsking(false)
    }
  }, [response, isModelGenerating, error])

  const checkForOverAsking = async (input: VerificationAnalysisInput) => {
    setIsProcessingOverAsking(true)
    if (isModelReady) {
      console.log('Model ready, using local LLM')
      const prompt = formatPrompt(input)
      await generate(prompt)
    } else {
      console.log('Local LLM not ready, using API')
      await analyzeVerificationApi(input)
        .then(setOverAskingResponse)
        .catch((e) => {
          console.error('Error analyzing verification:', e)
          setOverAskingResponse(fallbackResponse)
        })
        .finally(() => setIsProcessingOverAsking(false))
    }
  }

  return {
    isProcessingOverAsking,
    checkForOverAsking,
    overAskingResponse,
  }
}

const formatResult = (response: string) => {
  const match = response.match(/<response>([\s\S]*?)<\/response>/)
  if (!match) return

  const responseContent = match[1]

  if (responseContent.includes('<reason>') && responseContent.includes('<valid_request>')) {
    return {
      validRequest: responseContent.split('<valid_request>')[1].split('</valid_request>')[0] as
        | 'yes'
        | 'no'
        | 'could_not_determine',
      reason: responseContent.split('<reason>')[1].split('</reason>')[0],
    }
  }

  return fallbackResponse
}

const formatPrompt = (input: VerificationAnalysisInput) => {
  const cards = input.cards
    .map(
      (credential) =>
        `${credential.name} - ${credential.subtitle}. Requested attributes: ${credential.requestedAttributes.join(', ')}`
    )
    .join('\n')
  return `
You are an AI assistant specializing in data privacy analysis. Your task is to evaluate data verification requests and determine if they are asking for an appropriate amount of information or if they are overasking.

Here is the information for the current request:

<verifier_name>
${input.verifier.name}
</verifier_name>

<verifier_domain>
${input.verifier.domain}
</verifier_domain>

<request_name>
${input.name}
</request_name>

<request_purpose>
${input.purpose}
</request_purpose>

<requested_cards>
${cards}
</requested_cards>


Provide a small evaluation of the request, and provide your final response in the following XML structure:

<response>
<reason>Your concise reason for the assessment</reason>
<valid_request>yes</valid_request> <!-- Use 'yes', 'no', or 'could_not_determine' -->
</response>

Example of a properly formatted response:

<response>
<reason>Request aligns with purpose. Information amount appropriate. Verifier seems legitimate.</reason>
<valid_request>yes</valid_request>
</response>

Remember: Provide a concise reason and use the correct XML structure in your response. Do not add any text outside of the specified tags.
`
}
