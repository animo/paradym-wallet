import type { PropsWithChildren } from 'react'
import { useParadym } from '../hooks'
import { usePreFetchInboxDisplayMetadata } from '../hooks/usePreFetchInboxDisplayMetadata'

export const ExchangeRecordDisplayMetadataProvider = ({ children }: PropsWithChildren) => {
  const { paradym } = useParadym('unlocked')

  usePreFetchInboxDisplayMetadata({ paradym })

  return <>{children}</>
}
