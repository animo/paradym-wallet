import type { JwkDidCreateOptions } from '@aries-framework/core'

import { AskarModule } from '@aries-framework/askar'
import {
  JwkDidRegistrar,
  JwkDidResolver,
  Agent,
  ConsoleLogger,
  DidsModule,
  KeyDidRegistrar,
  KeyDidResolver,
  KeyType,
  LogLevel,
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
      dids: new DidsModule({
        registrars: [new KeyDidRegistrar(), new JwkDidRegistrar()],
        resolvers: [new WebDidResolver(), new KeyDidResolver(), new JwkDidResolver()],
      }),
      openId4VcClient: new OpenId4VcClientModule(),
    },
  })

  await agent.initialize()

  // FIXME: We probably want to create a new did for each of the credentials we request to avoid correlation between the credentials.
  const hasKeyDid = (await agent.dids.getCreatedDids({ method: 'jwk' })).length !== 0

  if (!hasKeyDid) {
    await agent.dids.create<JwkDidCreateOptions>({
      method: 'jwk',
      options: {
        keyType: KeyType.Ed25519,
      },
    })
  }

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
