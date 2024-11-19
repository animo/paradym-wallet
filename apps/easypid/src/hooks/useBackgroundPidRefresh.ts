import { MdocRecord, SdJwtVcRecord } from '@credo-ts/core'
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
  const { credentials } = usePidCredential()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasInternet = useHasInternetConnection()
  const shouldUseCloudHsm = useShouldUseCloudHsm()
  const { agent } = useAppAgent()

  const { sdJwt, mdoc } = useMemo(() => {
    if (!shouldUseCloudHsm) return {}
    const sdJwt = credentials?.find((c) => c.record instanceof SdJwtVcRecord)?.record as SdJwtVcRecord | undefined
    const mdoc = credentials?.find((c) => c.record instanceof MdocRecord)?.record as MdocRecord | undefined

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
      sdJwt: sdJwt
        ? {
            record: sdJwt,
            shouldRefresh: shouldRefreshSdJwt,
          }
        : undefined,
      mdoc: mdoc
        ? {
            record: mdoc,
            shouldRefresh: shouldRefreshMdoc,
          }
        : undefined,
    }
  }, [credentials, batchThreshold, shouldUseCloudHsm])

  useEffect(() => {
    if (isRefreshing || !hasInternet || !shouldUseCloudHsm) return

    if (sdJwt?.shouldRefresh || mdoc?.shouldRefresh) {
      setIsRefreshing(true)

      refreshPid({
        agent,
        sdJwt: sdJwt?.shouldRefresh ? sdJwt?.record : undefined,
        mdoc: mdoc?.shouldRefresh ? mdoc?.record : undefined,
      }).finally(() => setIsRefreshing(false))
    }
  }, [
    sdJwt?.shouldRefresh,
    mdoc?.shouldRefresh,
    hasInternet,
    agent,
    isRefreshing,
    mdoc?.record,
    sdJwt?.record,
    shouldUseCloudHsm,
  ])
}
