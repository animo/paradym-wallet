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
import { CheqdAnonCredsRegistry, CheqdDidResolver, CheqdModule, CheqdModuleConfig } from '@credo-ts/cheqd'
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  ClaimFormat,
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
  Mdoc,
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

import { bdrPidIssuerCertificate, pidSchemes } from '../../../apps/easypid/src/constants'
import { indyNetworks } from './indyNetworks'
import { appLogger } from './logger'

const askarModule = new AskarModule({
  ariesAskar: ariesAskar,
})

export const initializeEasyPIDAgent = async ({
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
      x509: new X509Module({
        getTrustedCertificatesForVerification: (agentContext, { certificateChain, verification }) => {
          if (verification.type === 'credential') {
            // Only allow BDR certificate for PID credentials for now
            if (
              verification.credential instanceof Mdoc &&
              pidSchemes.msoMdocDoctypes.includes(verification.credential.docType)
            ) {
              return [bdrPidIssuerCertificate]
            }

            if (
              verification.credential.claimFormat === ClaimFormat.SdJwtVc &&
              pidSchemes.sdJwtVcVcts.includes(verification.credential.payload.vct as string)
            ) {
              return [bdrPidIssuerCertificate]
            }

            // If not PID, we allow any certificate for now
            return [certificateChain[0].toString('pem')]
          }

          // Allow any actor for auth requests for now
          if (verification.type === 'oauth2SecuredAuthorizationRequest') {
            return [certificateChain[0].toString('pem')]
          }

          return undefined
        },
        trustedCertificates:
          trustedX509Certificates.length > 0 ? (trustedX509Certificates as [string, ...string[]]) : undefined,
      }),
      dids: new DidsModule({
        registrars: [new KeyDidRegistrar(), new JwkDidRegistrar()],
        resolvers: [
          new WebDidResolver(),
          new KeyDidResolver(),
          new JwkDidResolver(),
          // new CheqdDidResolver(),
          new IndyVdrSovDidResolver(),
          new IndyVdrIndyDidResolver(),
        ],
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndyVdrAnonCredsRegistry(), new DidWebAnonCredsRegistry() /* new CheqdAnonCredsRegistry() */],
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
      // cheqd: new CheqdModule(
      //   new CheqdModuleConfig({
      //     networks: [
      //       {
      //         network: 'testnet',
      //       },
      //       {
      //         network: 'mainnet',
      //       },
      //     ],
      //   })
      // ),
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
  // // FIXME: in the easypid app importing the cheqd module gives errors. As we're not using cheqd in the EasyPid wallet
  // // we protect it like this, but I think the Paradym Wallet must be broken as well then?!?
  // const { CheqdAnonCredsRegistry, CheqdDidResolver, CheqdModule, CheqdModuleConfig } =
  //   require('@credo-ts/cheqd') as typeof import('@credo-ts/cheqd')

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
          // new CheqdDidResolver(),
          new IndyVdrSovDidResolver(),
          new IndyVdrIndyDidResolver(),
        ],
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndyVdrAnonCredsRegistry() /* new CheqdAnonCredsRegistry(), new DidWebAnonCredsRegistry() */],
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
      // cheqd: new CheqdModule(
      //   new CheqdModuleConfig({
      //     networks: [
      //       {
      //         network: 'testnet',
      //       },
      //       {
      //         network: 'mainnet',
      //       },
      //     ],
      //   })
      // ),
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

export type FullAppAgent = Awaited<ReturnType<typeof initializeEasyPIDAgent>>
export type EasyPIDAppAgent = Awaited<ReturnType<typeof initializeEasyPIDAgent>>
export type EitherAgent = FullAppAgent | EasyPIDAppAgent

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
