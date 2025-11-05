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
import { CheqdAnonCredsRegistry, CheqdModule, CheqdModuleConfig } from '@credo-ts/cheqd'
import { Agent, DidsModule, Kms, X509Module, type X509ModuleConfigOptions } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommConnectionsModule,
  DidCommCredentialV2Protocol,
  DidCommCredentialsModule,
  DidCommDiscoverFeaturesModule,
  DidCommHttpOutboundTransport,
  DidCommMediationRecipientModule,
  DidCommMessagePickupModule,
  DidCommModule,
  DidCommOutOfBandModule,
  DidCommProofV2Protocol,
  DidCommProofsModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { SecureEnvironmentKeyManagementService, agentDependencies } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'
import { ParadymWalletMustBeDidCommAgentError, ParadymWalletMustBeOpenId4VcAgentError } from './error'
import { type LogLevel, logger } from './logger'
import { secureWalletKey } from './secure'

export type SetupAgentOptions = {
  /**
   *
   * Unique identifier of your wallet storage
   *
   */
  id?: string

  /**
   *
   * Key that will be used to securely open your wallet
   *
   * @security
   * This property must dealt with in great care, such as receiving it from a biometrics check
   *
   */
  key: string

  /**
   *
   * Configuration regarding logging with the Paradym Wallet SDK
   *
   */
  logging?: {
    /**
     *
     * Loglevel to be used. Set to `trace` to log everything and `off` for nothing
     *
     */
    level: LogLevel

    /**
     *
     * Whether to trace the logs. Later, this can be exported
     *
     * exporting the logs can be done with the following:
     *
     * ```typescript
     * const { paradym } = useParadym('unlocked')
     * const logs = paradym.logger.loggedMessageContents
     * ```
     *
     */
    trace?: boolean

    /**
     *
     * Number of logs to be traced.
     *
     */
    traceLimit?: number
  }

  /**
   *
   * Configuration for when OpenId4Vc is used
   *
   * @note by default, openid4vc is configured on the agent
   *
   * @note to disable openid4vc, pass in `false`
   *
   */
  openId4VcConfiguration?: ({} & X509ModuleConfigOptions) | false

  /**
   *
   * Configuration for when DidComm is used
   *
   * @note by default, DIDComm is *not* configured on the agent
   *
   * @note to disable didcomm explicitly, pass in `false`
   *
   */
  didcommConfiguration?:
    | {
        /**
         *
         * Label used for DIDComm connections to convey who you are to the other agent
         *
         */
        label: string
      }
    | false
}

/**
 *
 * Function that sets up everything needed for the functionality required in a wallet.
 *
 */
export const setupAgent = (options: SetupAgentOptions) => {
  const openId4VcConfiguration = options.openId4VcConfiguration ?? {}

  const didcommConfiguration = options.didcommConfiguration ?? false

  const walletKeyVersion = secureWalletKey.getWalletKeyVersion()

  const modules = {
    askar: new AskarModule({
      enableKms: false,
      askar,
      store: {
        id: `${options.id ?? 'paradym-wallet'}-${walletKeyVersion}`,
        key: options.key,
        keyDerivationMethod: 'raw',
      },
    }),
    kms: new Kms.KeyManagementModule({
      backends: [new AskarKeyManagementService(), new SecureEnvironmentKeyManagementService()],
      defaultBackend: 'askar',
    }),
    dids: new DidsModule(),

    ...(openId4VcConfiguration ? getOpenid4VcModules(openId4VcConfiguration) : {}),
    ...(didcommConfiguration ? getDidCommModules(didcommConfiguration) : {}),
  }

  const paradymWalletSdkLogger = options.logging ? logger(options.logging.level) : undefined

  if (options.logging?.trace) {
    paradymWalletSdkLogger?.trackLoggedMessages(options.logging.traceLimit)
  }

  const agent = new Agent({
    config: {
      logger: paradymWalletSdkLogger,
    },
    dependencies: agentDependencies,
    modules,
  })

  if (didcommConfiguration) {
    const didcommAgent = agent as unknown as DidCommAgent
    didcommAgent.modules.didcomm.registerOutboundTransport(new DidCommHttpOutboundTransport())
    didcommAgent.modules.didcomm.registerOutboundTransport(new DidCommWsOutboundTransport())
  }

  return agent
}

const getOpenid4VcModules = (openId4VcConfiguration: Exclude<SetupAgentOptions['openId4VcConfiguration'], false>) => ({
  openid4vc: new OpenId4VcModule({}),
  x509: new X509Module({
    trustedCertificates: openId4VcConfiguration?.trustedCertificates as undefined | [string, ...string[]],
    getTrustedCertificatesForVerification: openId4VcConfiguration?.getTrustedCertificatesForVerification,
  }),
})

// TODO: configure, or allow the user, to configure these modules
const getDidCommModules = (_didcommConfiguration: Exclude<SetupAgentOptions['didcommConfiguration'], false>) => ({
  didcomm: new DidCommModule(),
  connections: new DidCommConnectionsModule(),
  messagePickup: new DidCommMessagePickupModule(),
  discovery: new DidCommDiscoverFeaturesModule(),
  outOfBand: new DidCommOutOfBandModule(),
  mediationRecipient: new DidCommMediationRecipientModule(),
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
  anoncreds: new AnonCredsModule({
    registries: [new CheqdAnonCredsRegistry(), new DidWebAnonCredsRegistry()],
    anoncreds,
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
})

export type BaseAgent = Agent
export type DidCommAgent = Agent<ReturnType<typeof getDidCommModules>>
export type OpenId4VcAgent = Agent<ReturnType<typeof getOpenid4VcModules>>
export type FullAgent = Agent<ReturnType<typeof getDidCommModules> & ReturnType<typeof getOpenid4VcModules>>

export const isDidcommAgent = (agent: DidCommAgent | OpenId4VcAgent): boolean => 'didcomm' in agent.modules
export const assertDidcommAgent = (agent: DidCommAgent | OpenId4VcAgent): DidCommAgent => {
  if (!isDidcommAgent(agent)) {
    throw new ParadymWalletMustBeDidCommAgentError()
  }

  return agent as DidCommAgent
}

export const isOpenId4VcAgent = (agent: DidCommAgent | OpenId4VcAgent): boolean => 'openId4VcHolder' in agent.modules
export const assertOpenId4VcAgent = (agent: DidCommAgent | OpenId4VcAgent): OpenId4VcAgent => {
  if (!isOpenId4VcAgent(agent)) {
    throw new ParadymWalletMustBeOpenId4VcAgentError()
  }

  return agent as OpenId4VcAgent
}
