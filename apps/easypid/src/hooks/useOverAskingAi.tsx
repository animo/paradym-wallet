import { useEffect, useState } from 'react'

import { useLLM } from '@easypid/llm'
import type { OverAskingInput, OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { checkForOverAskingApi as analyzeVerificationApi } from '@easypid/use-cases/OverAskingApi'

const fallbackResponse: OverAskingResponse = {
  validRequest: 'could_not_determine',
  reason: 'Error determining if the request is valid.',
}

export function useOverAskingAi() {
  const [isProcessingOverAsking, setIsProcessingOverAsking] = useState(false)
  const [overAskingResponse, setOverAskingResponse] = useState<OverAskingResponse>()

  const { generate, response, error, isModelReady, isModelGenerating } = useLLM()

  useEffect(() => {
    if (error) {
      setIsProcessingOverAsking(false)
      setOverAskingResponse(fallbackResponse)
      return
    }

    if (!response || isModelGenerating) return

    try {
      const result = formatLocalResult(response)
      setOverAskingResponse(result)
    } catch (e) {
      console.error('Error parsing AI response:', e)
      setOverAskingResponse(fallbackResponse)
      setIsProcessingOverAsking(false)
    }
  }, [response, isModelGenerating, error])

  const checkForOverAsking = async (input: OverAskingInput) => {
    setIsProcessingOverAsking(true)
    if (isModelReady) {
      console.debug('Local LLM ready, using local LLM')
      const prompt = formatLocalPrompt(input)
      await generate(prompt)
    } else {
      console.debug('Local LLM not ready, using API')
      await analyzeVerificationApi(input)
        .then(setOverAskingResponse)
        .catch((e) => {
          console.error('Error analyzing verification using API:', e)
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

// AI responds in XML format, so we need to parse it
// Expected format:
//  <response>
//    <reason>Your concise reason for the assessment</reason>
//    <valid_request>yes</valid_request> <!-- Use 'yes', 'no', or 'could_not_determine' -->
//  </response>
const formatLocalResult = (response: string) => {
  const match = response.match(/<response>([\s\S]*?)<\/response>/)
  if (!match) return fallbackResponse

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

const formatLocalPrompt = (input: OverAskingInput) => {
  const cards = input.cards
    .map((credential) => `- ${credential.name}. Requested attributes: ${credential.requestedAttributes.join(', ')}`)
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

<request_purpose>
${input.purpose}
</request_purpose>

<requested_cards>
${cards}
</requested_cards>


Provide a short reason for your assessment of the request. Use the following XML structure:

<response>
<reason>Your concise reason for the assessment</reason>
<valid_request>yes</valid_request> <!-- Use 'yes', 'no', or 'could_not_determine' -->
</response>

Remember: DO NOT add any text outside of the specified tags. DO NOT bother responding with anything other than the XML structure.
`
}
