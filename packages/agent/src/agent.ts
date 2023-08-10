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
import { CheqdAnonCredsRegistry, CheqdDidRegistrar, CheqdDidResolver, CheqdModule, CheqdModuleConfig } from '@aries-framework/cheqd'
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
} from '@aries-framework/core'
import { IndyVdrAnonCredsRegistry, IndyVdrModule } from '@aries-framework/indy-vdr'
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
        // Here we add an Indy VDR registry as an example, any AnonCreds registry
        // can be used
        registries: [new IndyVdrAnonCredsRegistry(), new CheqdAnonCredsRegistry()],
      }),
      dids: new DidsModule({
        registrars: [new KeyDidRegistrar(), new JwkDidRegistrar(), new CheqdDidRegistrar()],
        resolvers: [new WebDidResolver(), new KeyDidResolver(), new JwkDidResolver(), new CheqdDidResolver()],
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
      cheqd: new CheqdModule(new CheqdModuleConfig({
        networks: [
          {
            network: 'testnet',
            cosmosPayerSeed:
              'robust across amount corn curve panther opera wish toe ring bleak empower wreck party abstract glad average muffin picnic jar squeeze annual long aunt',
          },
        ]
      }))
    },
  })

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
