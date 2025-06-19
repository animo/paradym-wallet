import type { PropsWithChildren } from 'react'
import type { DidCommAgent } from '../agent'

interface Props {
  agent: DidCommAgent
}

export const ExchangeRecordDisplayMetadataProvider = ({ agent, children }: PropsWithChildren<Props>) => {
  // TODO: add this back
  // usePreFetchInboxDisplayMetadata({ agent })

  return <>{children}</>
}
