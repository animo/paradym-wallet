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
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  ConnectionsModule,
  CredentialsModule,
  DidsModule,
  HttpOutboundTransport,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDerivationMethod,
  KeyDidRegistrar,
  KeyDidResolver,
  LogLevel,
  MediationRecipientModule,
  MediatorPickupStrategy,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
  WebDidResolver,
  WsOutboundTransport,
  X509Module,
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
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'

import { indyNetworks } from './indyNetworks'
import { appLogger } from './logger'

const askarModule = new AskarModule({
  ariesAskar: ariesAskar,
})

export const initializeAusweisAgent = async ({
  walletLabel,
  walletId,
  walletKey,
  keyDerivation,
  trustedX509Certificates,
}: {
  walletLabel: string
  walletId: string
  walletKey: string
  keyDerivation: 'raw' | 'derive'
  trustedX509Certificates: string[]
}) => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      label: walletLabel,
      walletConfig: {
        id: walletId,
        key: walletKey,
        keyDerivationMethod: keyDerivation === 'raw' ? KeyDerivationMethod.Raw : KeyDerivationMethod.Argon2IMod,
      },
      autoUpdateStorageOnStartup: true,
      logger: appLogger(LogLevel.debug),
    },
    modules: {
      ariesAskar: askarModule,
      openId4VcHolder: new OpenId4VcHolderModule(),
      x509: new X509Module({}),
    },
  })

  await agent.initialize()

  // Register the trusted x509 certificates
  for (const trustedCertificate of trustedX509Certificates) {
    agent.x509.addTrustedCertificate(trustedCertificate)
  }

  return agent
}

export const initializeFullAgent = async ({
  walletLabel,
  walletId,
  walletKey,
  keyDerivation,
}: {
  walletLabel: string
  walletId: string
  walletKey: string
  keyDerivation: 'raw' | 'derive'
}) => {
  // FIXME: in the funke app importing the cheqd module gives errors. As we're not using cheqd in the Funke wallet
  // we protect it like this, but I think the Paradym Wallet must be broken as well then?!?
  const { CheqdAnonCredsRegistry, CheqdDidResolver, CheqdModule, CheqdModuleConfig } =
    require('@credo-ts/cheqd') as typeof import('@credo-ts/cheqd')

  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      label: walletLabel,
      walletConfig: {
        id: walletId,
        key: walletKey,
        keyDerivationMethod: keyDerivation === 'raw' ? KeyDerivationMethod.Raw : KeyDerivationMethod.Argon2IMod,
      },
      autoUpdateStorageOnStartup: true,
      logger: appLogger(LogLevel.debug),
    },
    modules: {
      ariesAskar: askarModule,
      openId4VcHolder: new OpenId4VcHolderModule(),
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
      anoncreds: new AnonCredsModule({
        registries: [new IndyVdrAnonCredsRegistry(), new CheqdAnonCredsRegistry(), new DidWebAnonCredsRegistry()],
        anoncreds,
      }),

      mediationRecipient: new MediationRecipientModule({
        // We want to manually connect to the mediator, so it doesn't impact wallet startup
        mediatorPickupStrategy: MediatorPickupStrategy.None,
      }),

      indyVdr: new IndyVdrModule({
        indyVdr,
        networks: indyNetworks,
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
      credentials: new CredentialsModule({
        autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
        credentialProtocols: [
          new V1CredentialProtocol({
            indyCredentialFormat: new LegacyIndyCredentialFormatService(),
          }),
          new V2CredentialProtocol({
            credentialFormats: [new LegacyIndyCredentialFormatService(), new AnonCredsCredentialFormatService()],
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
    },
  })

  agent.registerOutboundTransport(new HttpOutboundTransport())
  agent.registerOutboundTransport(new WsOutboundTransport())

  await agent.initialize()

  return agent
}

export type FullAppAgent = Awaited<ReturnType<typeof initializeFullAgent>>
export type AusweisAppAgent = Awaited<ReturnType<typeof initializeAusweisAgent>>
export type EitherAgent = FullAppAgent | AusweisAppAgent

// biome-ignore lint/suspicious/noExplicitAny: it just needs to extend any, it won't actually be used
export const useAgent = <A extends Agent<any> = FullAppAgent>(): {
  agent: A
  loading: boolean
} => {
  const { agent, loading } = useAgentLib<A>()

  if (!agent) {
    throw new Error('useAgent should only be used inside AgentProvider with a valid agent.')
  }

  return { agent, loading }
}
