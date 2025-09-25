import { useCallback, useState } from 'react'

import type { OverAskingInput, OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { checkForOverAskingApi } from '@easypid/use-cases/OverAskingApi'
import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { useFeatureFlag } from './useFeatureFlag'

const fallbackResponse = {
  validRequest: 'could_not_determine',
  reason: defineMessage({
    id: 'aiOverAking.errorReasonFallback',
    message: 'Error determining if the request is valid.',
  }),
} as const

export function useOverAskingAi() {
  const [isProcessingOverAsking, setIsProcessingOverAsking] = useState(false)
  const [overAskingResponse, setOverAskingResponse] = useState<OverAskingResponse>()

  const { t } = useLingui()
  const isOverAskingAiEnabled = useFeatureFlag('AI_ANALYSIS')

  const checkForOverAsking = useCallback(
    async (input: OverAskingInput) => {
      if (!isOverAskingAiEnabled) {
        console.debug('Over-asking AI feature flag is not enabled, skipping')
        return
      }

      setIsProcessingOverAsking(true)

      console.debug('using API-based overasking detection')
      await checkForOverAskingApi(input)
        .then(setOverAskingResponse)
        .catch((e) => {
          console.error('Error analyzing verification using API:', e)
          setOverAskingResponse({ ...fallbackResponse, reason: t(fallbackResponse.reason) })
        })
        .finally(() => setIsProcessingOverAsking(false))
    },
    [isOverAskingAiEnabled, t]
  )

  const stopOverAsking = useCallback(() => {
    if (!overAskingResponse) setOverAskingResponse({ ...fallbackResponse, reason: t(fallbackResponse.reason) })
    setIsProcessingOverAsking(false)
  }, [overAskingResponse, t])

  return {
    isProcessingOverAsking,
    checkForOverAsking,
    overAskingResponse,
    stopOverAsking,
  }
}
