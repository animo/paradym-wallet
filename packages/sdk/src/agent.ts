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
import { Agent, DidsModule, Kms, PeerDidNumAlgo, X509Module, type X509ModuleConfigOptions } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommCredentialV2Protocol,
  DidCommHttpOutboundTransport,
  DidCommMediatorPickupStrategy,
  DidCommModule,
  DidCommProofV2Protocol,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { agentDependencies, SecureEnvironmentKeyManagementService } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'
import { ParadymWalletMustBeAgentTypeError } from './error'
import { type LogLevel, ParadymWalletSdkConsoleLogger, type ParadymWalletSdkLogger } from './logging'
import { secureWalletKey } from './secure'

export type SetupAgentOptions<T extends ParadymWalletSdkLogger = ParadymWalletSdkLogger> = {
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

    /**
     *
     * Provide a custom logger which implements the `ParadymWalletSdkLogger` interface.
     *
     *
     */
    customLogger?: new (
      logLevel: LogLevel
    ) => T
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

  const logger = options.logging?.customLogger
    ? new options.logging.customLogger(options.logging.level)
    : new ParadymWalletSdkConsoleLogger(options.logging?.level)

  const modules = {
    ...getBaseModules(options),
    ...(openId4VcConfiguration ? getOpenid4VcModules(openId4VcConfiguration) : {}),
    ...(didcommConfiguration ? getDidCommModules(didcommConfiguration) : {}),
  }

  if (options.logging?.trace && logger instanceof ParadymWalletSdkConsoleLogger) {
    logger?.trackLoggedMessages(options.logging.traceLimit)
  }

  const agent = new Agent({
    config: {
      logger,
    },
    dependencies: agentDependencies,
    modules,
  })

  if (didcommConfiguration) {
    const didcommAgent = agent as unknown as DidCommAgent
    didcommAgent.didcomm.registerOutboundTransport(new DidCommHttpOutboundTransport())
    didcommAgent.didcomm.registerOutboundTransport(new DidCommWsOutboundTransport())
  }

  return agent
}

const getBaseModules = (options: Pick<SetupAgentOptions, 'id' | 'key'>) => {
  const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
  return {
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
  }
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
  didcomm: new DidCommModule({
    transports: {
      outbound: [new DidCommHttpOutboundTransport(), new DidCommWsOutboundTransport()],
    },
    connections: {
      autoAcceptConnections: true,
      peerNumAlgoForDidExchangeRequests: PeerDidNumAlgo.GenesisDoc,
    },
    mediationRecipient: {
      // We want to manually connect to the mediator, so it doesn't impact wallet startup
      mediatorPickupStrategy: DidCommMediatorPickupStrategy.None,
    },
    credentials: {
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
    },
    proofs: {
      autoAcceptProofs: DidCommAutoAcceptProof.ContentApproved,
      proofProtocols: [
        new DidCommProofV1Protocol({
          indyProofFormat: new LegacyIndyDidCommProofFormatService(),
        }),
        new DidCommProofV2Protocol({
          proofFormats: [new LegacyIndyDidCommProofFormatService(), new AnonCredsDidCommProofFormatService()],
        }),
      ],
    },

    messagePickup: true,

    // We don't support messaging/mediator
    // basicMessages: false,
    // mediator: false,
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

export type BaseAgent = Agent<ReturnType<typeof getBaseModules>>
export type DidCommAgent = Agent<ReturnType<typeof getBaseModules> & ReturnType<typeof getDidCommModules>>
export type OpenId4VcAgent = Agent<ReturnType<typeof getBaseModules> & ReturnType<typeof getOpenid4VcModules>>
export type FullAgent = Agent<
  ReturnType<typeof getDidCommModules> & ReturnType<typeof getOpenid4VcModules> & ReturnType<typeof getBaseModules>
>

export type AnyAgent = DidCommAgent | OpenId4VcAgent | FullAgent

export type AgentType = 'openid4vc' | 'didcomm' | 'full'

export type AgentForAgentType<T extends AgentType> = T extends 'full'
  ? FullAgent
  : T extends 'didcomm'
    ? DidCommAgent
    : T extends 'openid4vc'
      ? OpenId4VcAgent
      : AnyAgent

export const isDidcommAgent = (agent: AnyAgent): agent is DidCommAgent => 'didcomm' in agent
export function assertDidcommAgent(agent: AnyAgent): asserts agent is DidCommAgent {
  assertAgentType(agent, 'didcomm')
}

export const isFullAgent = (agent: AnyAgent): agent is FullAgent => isDidcommAgent(agent) && isOpenId4VcAgent(agent)
export function assertFullAgent(agent: AnyAgent): asserts agent is FullAgent {
  assertAgentType(agent, 'full')
}

export const isOpenId4VcAgent = (agent: AnyAgent): agent is OpenId4VcAgent => 'openid4vc' in agent
export function assertOpenId4VcAgent(agent: AnyAgent): asserts agent is OpenId4VcAgent {
  assertAgentType(agent, 'openid4vc')
}

export function isAgentType<T extends AgentType>(agent: AnyAgent, agentType: T): agent is AgentForAgentType<T> {
  if (agentType === 'didcomm') return isDidcommAgent(agent)
  if (agentType === 'openid4vc') return isOpenId4VcAgent(agent)
  return isFullAgent(agent)
}

export function assertAgentType<T extends AgentType>(
  agent: AnyAgent,
  agentType: T
): asserts agent is AgentForAgentType<T> {
  if (!isAgentType(agent, agentType)) {
    throw new ParadymWalletMustBeAgentTypeError(agentType)
  }
}
