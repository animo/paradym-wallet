import type { MdocRecord, SdJwtVcRecord } from '@credo-ts/core'
import { getBatchCredentialMetadata } from '@package/agent/src/openid4vc/batchMetadata'
import { useHasInternetConnection } from '@package/app'
import { useEffect, useMemo, useState } from 'react'
import { type AppAgent, useAppAgent } from '../agent'
import { useShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'
import { RefreshPidUseCase } from '../use-cases/RefreshPidUseCase.ts'
import { usePidCredential } from './usePidCredential'

async function refreshPid({ agent, sdJwt, mdoc }: { agent: AppAgent; sdJwt?: SdJwtVcRecord; mdoc?: MdocRecord }) {
  console.log('refreshing PID')
  const useCase = await RefreshPidUseCase.initialize({
    agent,
  })

  await useCase.retrieveCredentialsUsingExistingRecords({
    sdJwt,
    mdoc,
  })
}

export function useBackgroundPidRefresh(batchThreshold: number) {
  const { sdJwt, mdoc } = usePidCredential()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasInternet = useHasInternetConnection()
  const shouldUseCloudHsm = useShouldUseCloudHsm()
  const { agent } = useAppAgent()

  const { shouldRefreshMdoc, shouldRefreshSdJwt } = useMemo(() => {
    if (!shouldUseCloudHsm) return {}

    let shouldRefreshSdJwt = false
    if (sdJwt) {
      const sdJwtBatch = getBatchCredentialMetadata(sdJwt)
      if (sdJwtBatch) {
        shouldRefreshSdJwt = sdJwtBatch.additionalCredentials.length <= batchThreshold
      }
    }

    let shouldRefreshMdoc = false
    if (mdoc) {
      const mdocBatch = getBatchCredentialMetadata(mdoc)
      if (mdocBatch) {
        shouldRefreshMdoc = mdocBatch.additionalCredentials.length <= batchThreshold
      }
    }

    return {
      shouldRefreshSdJwt,
      shouldRefreshMdoc,
    }
  }, [sdJwt, mdoc, batchThreshold, shouldUseCloudHsm])

  useEffect(() => {
    if (isRefreshing || !hasInternet || !shouldUseCloudHsm) return

    if (shouldRefreshMdoc || shouldRefreshSdJwt) {
      setIsRefreshing(true)

      refreshPid({
        agent,
        sdJwt: shouldRefreshSdJwt ? sdJwt : undefined,
        mdoc: shouldRefreshMdoc ? mdoc : undefined,
      }).finally(() => setIsRefreshing(false))
    }
  }, [shouldRefreshMdoc, shouldRefreshSdJwt, hasInternet, agent, isRefreshing, mdoc, sdJwt, shouldUseCloudHsm])
}
