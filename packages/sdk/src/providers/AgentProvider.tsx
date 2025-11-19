import { type PropsWithChildren, useMemo } from 'react'
import type { DidCommAgent } from '../agent'
import { ConnectionProvider } from './ConnectionProvider'
import { CredentialExchangeProvider } from './CredentialExchangeProvider'
import { ExchangeRecordDisplayMetadataProvider } from './ExchangeRecordDisplayMetadataProvider'
import { MdocRecordProvider } from './MdocProvider'
import { ProofExchangeProvider } from './ProofExchangeProvider'
import { SdJwtVcRecordProvider } from './SdJwtVcProvider'
import { W3cCredentialRecordProvider } from './W3cCredentialsProvider'
import { W3cV2CredentialRecordProvider } from './W3cV2CredentialsProvider'
import { WalletJsonStoreProvider } from './WalletJsonStoreProvider'

export const RecordProvider = ({
  agent,
  children,
  recordIds,
}: PropsWithChildren<{ agent: DidCommAgent; recordIds: string[] }>) => {
  // Use useMemo to prevent recreation of the providers array on each render
  const DynamicProviders = useMemo(() => {
    return [
      agent.didcomm.proofs || agent.didcomm.credentials
        ? ({ children }: PropsWithChildren<{ agent: DidCommAgent }>) => (
            <ExchangeRecordDisplayMetadataProvider agent={agent}>{children}</ExchangeRecordDisplayMetadataProvider>
          )
        : undefined,
      agent.didcomm.credentials ? CredentialExchangeProvider : undefined,
      agent.didcomm.proofs ? ProofExchangeProvider : undefined,
      agent.didcomm.connections ? ConnectionProvider : undefined,
    ].filter((p): p is Exclude<typeof p, undefined> => p !== undefined)
  }, [agent])

  // Memoize the nested providers structure to prevent recreation on each render
  return useMemo(() => {
    return DynamicProviders.reduce(
      (accChildren, Provider) => (
        <Provider key={Provider.name} agent={agent}>
          {accChildren}
        </Provider>
      ),
      <WalletJsonStoreProvider agent={agent} recordIds={recordIds}>
        <W3cV2CredentialRecordProvider agent={agent}>
          <W3cCredentialRecordProvider agent={agent}>
            <SdJwtVcRecordProvider agent={agent}>
              <MdocRecordProvider>{children}</MdocRecordProvider>
            </SdJwtVcRecordProvider>
          </W3cCredentialRecordProvider>
        </W3cV2CredentialRecordProvider>
      </WalletJsonStoreProvider>
    )
  }, [DynamicProviders, agent, children, recordIds])
}
