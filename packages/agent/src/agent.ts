import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
} from '@aries-framework/anoncreds'
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs'
import { AskarModule } from '@aries-framework/askar'
import {
  CheqdAnonCredsRegistry,
  CheqdDidResolver,
  CheqdModule,
  CheqdModuleConfig,
} from '@aries-framework/cheqd'
import {
  JwkDidRegistrar,
  JwkDidResolver,
  Agent,
  ConsoleLogger,
  DidsModule,
  KeyDidRegistrar,
  KeyDidResolver,
  LogLevel,
  WebDidResolver,
  CredentialsModule,
  V2CredentialProtocol,
  ProofsModule,
  V2ProofProtocol,
  AutoAcceptProof,
  AutoAcceptCredential,
  MediationRecipientModule,
  HttpOutboundTransport,
  WsOutboundTransport,
  ConnectionsModule,
  MediatorPickupStrategy,
} from '@aries-framework/core'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
  IndyVdrSovDidResolver,
} from '@aries-framework/indy-vdr'
import { useAgent as useAgentLib } from '@aries-framework/react-hooks'
import { agentDependencies } from '@aries-framework/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { indyVdr } from '@hyperledger/indy-vdr-react-native'
import { OpenId4VcClientModule } from '@internal/openid4vc-client'

import { indyNetworks } from './indyNetworks'

export const initializeAgent = async (walletKey: string) => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      label: 'Paradym Wallet',
      walletConfig: {
        id: 'paradym-wallet-secure',
        key: walletKey,
      },
      autoUpdateStorageOnStartup: true,
      logger: new ConsoleLogger(LogLevel.debug),
    },
    modules: {
      askar: new AskarModule({
        ariesAskar: ariesAskar,
      }),
      anoncredsRs: new AnonCredsRsModule({
        anoncreds,
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndyVdrAnonCredsRegistry(), new CheqdAnonCredsRegistry()],
      }),
      mediationRecipient: new MediationRecipientModule({
        // We want to manually connect to the mediator, so it doesn't impact wallet startup
        mediatorPickupStrategy: MediatorPickupStrategy.None,
      }),
      dids: new DidsModule({
        registrars: [new KeyDidRegistrar(), new JwkDidRegistrar()],
        resolvers: [
          new WebDidResolver(),
          new KeyDidResolver(),
          new JwkDidResolver(),
          new CheqdDidResolver(),
          new IndyVdrSovDidResolver(),
          new IndyVdrIndyDidResolver(),
        ],
      }),
      openId4VcClient: new OpenId4VcClientModule(),
      indyVdr: new IndyVdrModule({
        indyVdr,
        networks: indyNetworks,
      }),
      credentials: new CredentialsModule({
        autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
        credentialProtocols: [
          new V1CredentialProtocol({
            indyCredentialFormat: new LegacyIndyCredentialFormatService(),
          }),
          new V2CredentialProtocol({
            credentialFormats: [
              new LegacyIndyCredentialFormatService(),
              new AnonCredsCredentialFormatService(),
            ],
          }),
        ],
      }),
      proofs: new ProofsModule({
        autoAcceptProofs: AutoAcceptProof.ContentApproved,
        proofProtocols: [
          new V1ProofProtocol({
            indyProofFormat: new LegacyIndyProofFormatService(),
          }),
          new V2ProofProtocol({
            proofFormats: [new LegacyIndyProofFormatService(), new AnonCredsProofFormatService()],
          }),
        ],
      }),
      connections: new ConnectionsModule({
        autoAcceptConnections: true,
      }),
      cheqd: new CheqdModule(
        new CheqdModuleConfig({
          networks: [
            {
              network: 'testnet',
            },
            {
              network: 'mainnet',
            },
          ],
        })
      ),
    },
  })

  agent.registerOutboundTransport(new HttpOutboundTransport())
  agent.registerOutboundTransport(new WsOutboundTransport())

  await agent.initialize()

  return agent
}

export type AppAgent = Awaited<ReturnType<typeof initializeAgent>>
export const useAgent = (): { agent: AppAgent; loading: boolean } => {
  const { agent, loading } = useAgentLib()

  if (!agent) {
    throw new Error('useAgent should only be used inside AgentProvider with a valid agent.')
  }

  return { agent, loading }
}
