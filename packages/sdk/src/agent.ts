import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  DidsModule,
  KeyDerivationMethod,
  type ModulesMap,
  X509Module,
  type X509ModuleConfigOptions,
} from '@credo-ts/core'
import {
  ConnectionsModule,
  CredentialsModule,
  DidCommModule,
  DiscoverFeaturesModule,
  HttpOutboundTransport,
  MediationRecipientModule,
  MessagePickupModule,
  OutOfBandModule,
  ProofsModule,
  WsOutboundTransport,
} from '@credo-ts/didcomm'
import { OpenId4VcHolderModule } from '@credo-ts/openid4vc'
import { agentDependencies } from '@credo-ts/react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { type LogLevel, logger } from './logger'
import type { RequiredFields, StripOptionalAndUndefined } from './types'

export type InitializeAgentOptions<AdditionalModules extends ModulesMap = ModulesMap> = {
  /**
   *
   * Label used when using DIDComm to convey who you are
   *
   */
  label: string

  /**
   *
   * Unique identifier of your wallet storage
   *
   */
  id: string

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
   * The log level of the events that occur within the wallet
   *
   */
  logLevel?: LogLevel

  /**
   *
   * Custom agent modules that can be added
   *
   * @todo
   * This is not yet supported
   *
   */
  additionalAgentModules?: never

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
  didcommConfiguration?: false
}

/**
 *
 * Function that sets up everything needed for the functionality required in a wallet.
 *
 */
export const initializeAgent = async <AdditionalModules extends ModulesMap = ModulesMap>(
  options: InitializeAgentOptions<AdditionalModules>
) => {
  const openId4VcConfiguration = options.openId4VcConfiguration ?? {}

  const didcommConfiguration = options.didcommConfiguration

  const modules = {
    askar: new AskarModule({
      askar,
    }),

    ...(openId4VcConfiguration ? getOpenid4VcModules(openId4VcConfiguration) : {}),
    ...(didcommConfiguration ? getDidCommModules(didcommConfiguration) : {}),
  }

  const agent = new Agent({
    config: {
      label: options.label,
      walletConfig: {
        id: options.id,
        key: options.key,
        keyDerivationMethod: KeyDerivationMethod.Raw,
      },
      logger: options.logLevel ? logger(options.logLevel) : undefined,
    },
    dependencies: agentDependencies,
    modules,
  }) as Agent<Modules & OpenId4VcModules & DidCommModules>

  type OpenId4VcModules = StripOptionalAndUndefined<
    RequiredFields<typeof modules, keyof ReturnType<typeof getOpenid4VcModules>>
  >
  type DidCommModules = StripOptionalAndUndefined<
    RequiredFields<typeof modules, keyof ReturnType<typeof getDidCommModules>>
  >
  type Modules = StripOptionalAndUndefined<typeof modules>

  if (didcommConfiguration) {
    agent.modules.didcomm.registerOutboundTransport(new HttpOutboundTransport())
    agent.modules.didcomm.registerOutboundTransport(new WsOutboundTransport())
  }

  await agent.initialize()

  // TODO: OpenId4VcModules and DidCommModules types should be added dynamically based on whether the configuration is provided
  return agent
}

const getOpenid4VcModules = (
  openId4VcConfiguration: Exclude<InitializeAgentOptions['openId4VcConfiguration'], false>
) => ({
  openId4VcHolder: new OpenId4VcHolderModule(),
  x509: new X509Module({
    trustedCertificates: openId4VcConfiguration?.trustedCertificates as undefined | [string, ...string[]],
    getTrustedCertificatesForVerification: openId4VcConfiguration?.getTrustedCertificatesForVerification,
  }),
})

// TODO: configure, or allow the user, to configure these modules
const getDidCommModules = (_didcommConfiguration: Exclude<InitializeAgentOptions['didcommConfiguration'], false>) => ({
  connections: new ConnectionsModule(),
  messagePickup: new MessagePickupModule(),
  discovery: new DiscoverFeaturesModule(),
  dids: new DidsModule(),
  outOfBand: new OutOfBandModule(),
  didcomm: new DidCommModule(),
  mediatorRecipient: new MediationRecipientModule(),
  credentials: new CredentialsModule(),
  proofs: new ProofsModule(),
})

export type DidCommAgent = Agent<ReturnType<typeof getDidCommModules>>
export type OpenId4VcAgent = Agent<ReturnType<typeof getOpenid4VcModules>>
