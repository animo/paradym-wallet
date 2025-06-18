import type { PropsWithChildren } from 'react'
import type { DidCommAgent } from '../agent'
import { usePreFetchInboxDisplayMetadata } from '../hooks/useInboxNotifications'

interface Props {
  agent: DidCommAgent
}

export const ExchangeRecordDisplayMetadataProvider = ({ agent, children }: PropsWithChildren<Props>) => {
  usePreFetchInboxDisplayMetadata({ agent })

  return <>{children}</>
}
