import type { PropsWithChildren } from 'react'

import { usePreFetchInboxDisplayMetadata } from '../hooks/useInboxNotifications'

export const ExchangeRecordDisplayMetadataProvider = ({ children }: PropsWithChildren) => {
  usePreFetchInboxDisplayMetadata()

  return <>{children}</>
}
