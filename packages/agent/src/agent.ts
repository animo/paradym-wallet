import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
} from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import {
  CheqdAnonCredsRegistry,
  CheqdDidResolver,
  CheqdModule,
  CheqdModuleConfig,
} from '@credo-ts/cheqd'
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
  KeyDerivationMethod,
} from '@credo-ts/core'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
  IndyVdrSovDidResolver,
} from '@credo-ts/indy-vdr'
import { OpenId4VcHolderModule } from '@credo-ts/openid4vc'
import { useAgent as useAgentLib } from '@credo-ts/react-hooks'
import { agentDependencies } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { indyVdr } from '@hyperledger/indy-vdr-react-native'

import { indyNetworks } from './indyNetworks'

export const initializeAgent = async ({
  walletKey,
  keyDerivation,
}: {
  walletKey: string
  keyDerivation: 'raw' | 'derive'
}) => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      label: 'Paradym Wallet',
      walletConfig: {
        id: 'paradym-wallet-secure',
        key: walletKey,
        keyDerivationMethod:
          keyDerivation === 'raw' ? KeyDerivationMethod.Raw : KeyDerivationMethod.Argon2IMod,
      },
      autoUpdateStorageOnStartup: true,
      logger: new ConsoleLogger(LogLevel.debug),
    },
    modules: {
      askar: new AskarModule({
        ariesAskar: ariesAskar,
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndyVdrAnonCredsRegistry(), new CheqdAnonCredsRegistry()],
        anoncreds,
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
      openId4VcHolder: new OpenId4VcHolderModule(),
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
