import {
  AnonCredsDidCommCredentialFormatService,
  AnonCredsDidCommProofFormatService,
  AnonCredsModule,
  DidCommCredentialV1Protocol,
  DidCommProofV1Protocol,
  LegacyIndyDidCommCredentialFormatService,
  LegacyIndyDidCommProofFormatService,
} from '@credo-ts/anoncreds'
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { CheqdAnonCredsRegistry, CheqdDidResolver, CheqdModule, CheqdModuleConfig } from '@credo-ts/cheqd'
import {
  Agent,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  Kms,
  PeerDidNumAlgo,
  WebDidResolver,
  X509Module,
} from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommConnectionsModule,
  DidCommCredentialV2Protocol,
  DidCommCredentialsModule,
  DidCommDiscoverFeaturesModule,
  DidCommHttpOutboundTransport,
  DidCommMediationRecipientModule,
  DidCommMediatorPickupStrategy,
  DidCommMessagePickupModule,
  DidCommModule,
  DidCommOutOfBandModule,
  DidCommProofV2Protocol,
  DidCommProofsModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
export { useAgent } from './providers'
import { SecureEnvironmentKeyManagementService, agentDependencies } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'
import { logger } from './logger'

export const initializeEasyPIDAgent = async ({
  walletId,
  walletKey,
  keyDerivation,
  trustedX509Certificates,
}: {
  walletId: string
  walletKey: string
  keyDerivation: 'raw' | 'derive'
  trustedX509Certificates: string[]
}) => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      autoUpdateStorageOnStartup: true,
      logger,
    },
    modules: {
      askar: new AskarModule({
        askar,
        // We register it manually to set default / determine order
        // FIXME: we should not require enableKms to be set to false
        // but just not re-register
        enableKms: false,
        store: {
          id: walletId,
          key: walletKey,
          keyDerivationMethod: keyDerivation === 'raw' ? 'raw' : 'kdf:argon2i:mod',
        },
      }),
      kms: new Kms.KeyManagementModule({
        backends: [new AskarKeyManagementService(), new SecureEnvironmentKeyManagementService()],
        defaultBackend: 'askar',
      }),
      openid4vc: new OpenId4VcModule({}),
      x509: new X509Module({
        getTrustedCertificatesForVerification: (agentContext, { certificateChain, verification }) => {
          if (verification.type === 'credential') {
            // Temprorary allow any certificates, also for PID
            // Only allow BDR certificate for PID credentials for now
            // if (
            //   verification.credential instanceof Mdoc &&
            //   pidSchemes.msoMdocDoctypes.includes(verification.credential.docType)
            // ) {
            //   return [bdrPidIssuerCertificate]
            // }

            // if (
            //   verification.credential.claimFormat === ClaimFormat.SdJwtDc &&
            //   pidSchemes.sdJwtVcVcts.includes(verification.credential.payload.vct as string)
            // ) {
            //   return [bdrPidIssuerCertificate]
            // }

            // If not PID, we allow any certificate for now
            return [certificateChain[certificateChain.length - 1].toString('pem')]
          }

          // Allow any actor for auth requests for now
          if (verification.type === 'oauth2SecuredAuthorizationRequest') {
            return [certificateChain[certificateChain.length - 1].toString('pem')]
          }

          return undefined
        },
        trustedCertificates:
          trustedX509Certificates.length > 0 ? (trustedX509Certificates as [string, ...string[]]) : undefined,
      }),
    },
  })

  await agent.initialize()

  return agent
}

export const initializeParadymAgent = async ({
  walletId,
  walletKey,
  keyDerivation,
  trustedX509Certificates = [],
}: {
  walletId: string
  walletKey: string
  keyDerivation: 'raw' | 'derive'
  trustedX509Certificates?: string[]
}) => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      autoUpdateStorageOnStartup: true,
      logger,
    },
    modules: {
      messagePickup: new DidCommMessagePickupModule(),
      discovery: new DidCommDiscoverFeaturesModule(),
      askar: new AskarModule({
        askar,
        store: {
          id: walletId,
          key: walletKey,
          keyDerivationMethod: keyDerivation === 'raw' ? 'raw' : 'kdf:argon2i:mod',
        },
      }),
      openid4vc: new OpenId4VcModule({}),
      x509: new X509Module({
        getTrustedCertificatesForVerification: (_, { certificateChain, verification }) => {
          if (verification.type === 'credential') {
            // If not PID, we allow any certificate for now
            return [certificateChain[certificateChain.length - 1].toString('pem')]
          }

          // Allow any actor for auth requests for now
          if (verification.type === 'oauth2SecuredAuthorizationRequest') {
            return [certificateChain[certificateChain.length - 1].toString('pem')]
          }

          return undefined
        },
        trustedCertificates:
          trustedX509Certificates.length > 0 ? (trustedX509Certificates as [string, ...string[]]) : undefined,
      }),
      dids: new DidsModule({
        registrars: [new KeyDidRegistrar(), new JwkDidRegistrar()],
        resolvers: [new WebDidResolver(), new KeyDidResolver(), new JwkDidResolver(), new CheqdDidResolver()],
      }),
      outOfBand: new DidCommOutOfBandModule(),
      didcomm: new DidCommModule(),
      anoncreds: new AnonCredsModule({
        registries: [new CheqdAnonCredsRegistry(), new DidWebAnonCredsRegistry()],
        anoncreds,
      }),
      mediationRecipient: new DidCommMediationRecipientModule({
        // We want to manually connect to the mediator, so it doesn't impact wallet startup
        mediatorPickupStrategy: DidCommMediatorPickupStrategy.None,
      }),
      connections: new DidCommConnectionsModule({
        autoAcceptConnections: true,
        peerNumAlgoForDidExchangeRequests: PeerDidNumAlgo.GenesisDoc,
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
      credentials: new DidCommCredentialsModule({
        autoAcceptCredentials: DidCommAutoAcceptCredential.ContentApproved,
        credentialProtocols: [
          new DidCommCredentialV1Protocol({
            indyCredentialFormat: new LegacyIndyDidCommCredentialFormatService(),
          }),
          new DidCommCredentialV2Protocol({
            credentialFormats: [
              new LegacyIndyDidCommCredentialFormatService(),
              new AnonCredsDidCommCredentialFormatService(),
            ],
          }),
        ],
      }),
      proofs: new DidCommProofsModule({
        autoAcceptProofs: DidCommAutoAcceptProof.ContentApproved,
        proofProtocols: [
          new DidCommProofV1Protocol({
            indyProofFormat: new LegacyIndyDidCommProofFormatService(),
          }),
          new DidCommProofV2Protocol({
            proofFormats: [new LegacyIndyDidCommProofFormatService(), new AnonCredsDidCommProofFormatService()],
          }),
        ],
      }),
    },
  })

  agent.modules.didcomm.registerOutboundTransport(new DidCommHttpOutboundTransport())
  agent.modules.didcomm.registerOutboundTransport(new DidCommWsOutboundTransport())

  await agent.initialize()

  return agent
}

export type ParadymAppAgent = Awaited<ReturnType<typeof initializeParadymAgent>>
export type EasyPIDAppAgent = Awaited<ReturnType<typeof initializeEasyPIDAgent>>
export type EitherAgent = ParadymAppAgent | EasyPIDAppAgent

export const isParadymAgent = (agent: EitherAgent): agent is ParadymAppAgent => {
  return 'anoncreds' in agent.modules
}

export const isEasyPIDAgent = (agent: EitherAgent): agent is EasyPIDAppAgent => {
  return !('anoncreds' in agent.modules)
}
