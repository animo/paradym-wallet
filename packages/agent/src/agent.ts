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
  ClaimFormat,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDerivationMethod,
  KeyDidRegistrar,
  KeyDidResolver,
  LogLevel,
  Mdoc,
  WebDidResolver,
  X509Module,
} from '@credo-ts/core'
import {
  AutoAcceptCredential,
  AutoAcceptProof,
  ConnectionsModule,
  CredentialsModule,
  DidCommModule,
  HttpOutboundTransport,
  MediationRecipientModule,
  MediatorPickupStrategy,
  OutOfBandModule,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
  WsOutboundTransport,
} from '@credo-ts/didcomm'
import { OpenId4VcHolderModule } from '@credo-ts/openid4vc'
export { useAgent } from './providers'
import { agentDependencies } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'

import { bdrPidIssuerCertificate, pidSchemes } from '@easypid/constants'
import { appLogger } from './logger'

const askarModule = new AskarModule({
  askar,
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
      askar: askarModule,
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
    },
  })

  await agent.initialize()

  return agent
}

export const initializeParadymAgent = async ({
  walletLabel,
  walletId,
  walletKey,
  keyDerivation,
  trustedX509Certificates = [],
}: {
  walletLabel: string
  walletId: string
  walletKey: string
  keyDerivation: 'raw' | 'derive'
  trustedX509Certificates?: string[]
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
        getTrustedCertificatesForVerification: (_, { certificateChain, verification }) => {
          if (verification.type === 'credential') {
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
        resolvers: [new WebDidResolver(), new KeyDidResolver(), new JwkDidResolver(), new CheqdDidResolver()],
      }),
      outOfBand: new OutOfBandModule(),
      didcomm: new DidCommModule(),
      anoncreds: new AnonCredsModule({
        registries: [new CheqdAnonCredsRegistry(), new DidWebAnonCredsRegistry()],
        anoncreds,
      }),
      mediationRecipient: new MediationRecipientModule({
        // We want to manually connect to the mediator, so it doesn't impact wallet startup
        mediatorPickupStrategy: MediatorPickupStrategy.None,
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

  agent.modules.didcomm.registerOutboundTransport(new HttpOutboundTransport())
  agent.modules.didcomm.registerOutboundTransport(new WsOutboundTransport())

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
