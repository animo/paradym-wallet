import { AskarModule } from '@aries-framework/askar'
import {
  Agent,
  ConsoleLogger,
  DidsModule,
  KeyDidRegistrar,
  KeyDidResolver,
  LogLevel,
  PeerDidRegistrar,
  WebDidResolver,
} from '@aries-framework/core'
import { OpenId4VcClientModule } from '@aries-framework/openid4vc-client'
import { useAgent as useAgentLib } from '@aries-framework/react-hooks'
import { agentDependencies } from '@aries-framework/react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

export const initializeAgent = async () => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      label: 'Paradym Wallet',
      // FIXME: AW-58: Store wallet key in secure enclave
      walletConfig: {
        id: 'paradym-wallet',
        key: 'a5fc4d22-5e0c-434b-abb5-c091815cf279',
      },
      autoUpdateStorageOnStartup: true,
      logger: new ConsoleLogger(LogLevel.debug),
    },
    modules: {
      askar: new AskarModule({
        ariesAskar: ariesAskar,
      }),
      // TODO: add did:jwk resolver and registrar
      dids: new DidsModule({
        registrars: [new KeyDidRegistrar(), new PeerDidRegistrar()],
        resolvers: [new WebDidResolver(), new KeyDidResolver()],
      }),
      openId4VcClient: new OpenId4VcClientModule(),
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
