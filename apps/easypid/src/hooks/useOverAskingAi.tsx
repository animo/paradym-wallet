import { useEffect, useState } from 'react'

import { useLLM } from '@easypid/llm'
import type { OverAskingInput, OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { EXCLUDED_ATTRIBUTES_FOR_ANALYSIS, checkForOverAskingApi } from '@easypid/use-cases/OverAskingApi'
import { useFeatureFlag } from './useFeatureFlag'

const fallbackResponse: OverAskingResponse = {
  validRequest: 'could_not_determine',
  reason: 'Error determining if the request is valid.',
}

export function useOverAskingAi() {
  const [isProcessingOverAsking, setIsProcessingOverAsking] = useState(false)
  const [overAskingResponse, setOverAskingResponse] = useState<OverAskingResponse>()

  const { generate, response, error, isModelReady, isModelGenerating, interrupt } = useLLM()
  const isOverAskingAiEnabled = useFeatureFlag('AI_ANALYSIS')

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
    if (!isOverAskingAiEnabled) {
      console.debug('Over-asking AI feature flag is not enabled, skipping')
      return
    }

    setIsProcessingOverAsking(true)
    if (isModelReady) {
      console.debug('Local LLM ready, using local LLM')
      const prompt = formatLocalPrompt(input)
      await generate(prompt)
    } else {
      console.debug('Local LLM not ready, using API')
      await checkForOverAskingApi(input)
        .then(setOverAskingResponse)
        .catch((e) => {
          console.error('Error analyzing verification using API:', e)
          setOverAskingResponse(fallbackResponse)
        })
        .finally(() => setIsProcessingOverAsking(false))
    }
  }

  const stopOverAsking = () => {
    if (isModelReady) interrupt()
    if (!overAskingResponse) setOverAskingResponse(fallbackResponse)
    setIsProcessingOverAsking(false)
  }

  return {
    isProcessingOverAsking,
    checkForOverAsking,
    overAskingResponse,
    stopOverAsking,
  }
}

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
    .map(
      (credential) => `
    <card>
      <name>${credential.name}</name>
      <requested_attributes>
        ${credential.requestedAttributes
          .filter((attr) => !EXCLUDED_ATTRIBUTES_FOR_ANALYSIS.includes(attr))
          .map((attr) => `<attribute>${attr}</attribute>`)
          .join('\n        ')}
      </requested_attributes>
    </card>`
    )
    .join('\n')

  return `
  <input>
    <verifier_name>${input.verifier.name}</verifier_name>
    <verifier_domain>${input.verifier.domain}</verifier_domain>
    <request_purpose>${input.purpose}</request_purpose>
    <requested_cards>
      ${cards}
    </requested_cards>
  </input>
`
}
