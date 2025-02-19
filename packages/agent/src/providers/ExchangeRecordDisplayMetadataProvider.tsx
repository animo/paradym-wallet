import type { PropsWithChildren } from 'react'

import type { ParadymAppAgent } from '../agent'
import { usePreFetchInboxDisplayMetadata } from '../hooks/useInboxNotifications'

interface Props {
  agent: ParadymAppAgent
}

export const ExchangeRecordDisplayMetadataProvider = ({ agent, children }: PropsWithChildren<Props>) => {
  usePreFetchInboxDisplayMetadata({ agent })

  return <>{children}</>
}
