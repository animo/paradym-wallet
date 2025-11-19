import type { PropsWithChildren } from 'react'
import type { DidCommAgent } from '../agent'
import { useParadym } from '../hooks'
import { usePreFetchInboxDisplayMetadata } from '../hooks/usePreFetchInboxDisplayMetadata'

interface ExchangeRecordDisplayMetadataProviderProps {
  agent: DidCommAgent
}

export const ExchangeRecordDisplayMetadataProvider = ({
  children,
}: PropsWithChildren<ExchangeRecordDisplayMetadataProviderProps>) => {
  const { paradym } = useParadym('unlocked')

  usePreFetchInboxDisplayMetadata({ paradym })

  return <>{children}</>
}
