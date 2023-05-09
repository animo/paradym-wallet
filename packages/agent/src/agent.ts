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
import { NativeModules } from 'react-native'
import { agentDependencies } from '@aries-framework/react-native'
import { OpenId4VcClientModule } from '@aries-framework/openid4vc-client'
import { AskarModule } from '@aries-framework/askar'

import { ariesAskar, registerAriesAskar } from '@hyperledger/aries-askar-react-native'
import { ReactNativeAriesAskar } from '@hyperledger/aries-askar-react-native/build/ReactNativeAriesAskar'
import { useAgent as useAgentLib } from '@aries-framework/react-hooks'

export const initializeAgent = async () => {
  // FIXME: AW-39: Askar doesn't fully work in expo. iOS works with this hack, android is still broken
  NativeModules.AriesAskar.install()
  registerAriesAskar({
    // @ts-ignore
    askar: new ReactNativeAriesAskar(_aries_askar),
  })

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
