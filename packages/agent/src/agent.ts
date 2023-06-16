import type { JwkDidCreateOptions } from '@aries-framework/core'

import { AskarModule } from '@aries-framework/askar'
import {
  W3cJwtVerifiableCredential,
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
import { useAgent as useAgentLib } from '@aries-framework/react-hooks'
import { agentDependencies } from '@aries-framework/react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { OpenId4VcClientModule } from '@internal/openid4vc-client'

export const initializeAgent = async (walletKey: string) => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      label: 'Paradym Wallet',
      walletConfig: {
        id: 'paradym-wallet-secure',
        key: walletKey,
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

  // Check if dbc credential is already in the wallet
  const [dbcCredential] = await agent.w3cCredentials.findCredentialRecordsByQuery({
    subjectIds: [
      'did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSJ9',
    ],
  })

  if (!dbcCredential) {
    await agent.w3cCredentials.storeCredential({
      credential: W3cJwtVerifiableCredential.fromSerializedJwt(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVlY3Vacjg2OXZTNTl4R1BSTmRTTnFEVHBvc2pTWlVqQ1E3c1RoUkExeDRDNyN6RG5hZWVjdVpyODY5dlM1OXhHUFJOZFNOcURUcG9zalNaVWpDUTdzVGhSQTF4NEM3In0.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiREJDQ29uZmVyZW5jZUF0dGVuZGVlIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImZpcnN0TmFtZSI6IkphbiIsImxhc3ROYW1lIjoiUmlldHZlbGQiLCJlbWFpbCI6ImphbkBhbmltby5pZCIsImV2ZW50Ijp7Im5hbWUiOiJEQkMgQ29uZmVyZW5jZSAyMDIzIiwiZGF0ZSI6IjIwMjMtMDYtMjYifX19LCJpc3MiOiJkaWQ6a2V5OnpEbmFlZWN1WnI4Njl2UzU5eEdQUk5kU05xRFRwb3NqU1pVakNRN3NUaFJBMXg0QzciLCJzdWIiOiJkaWQ6andrOmV5SmpjbllpT2lKUUxUSTFOaUlzSW10MGVTSTZJa1ZESWl3aWVDSTZJbUZqWWtsUmFYVk5jek5wT0Y5MWMzcEZha295ZEhCVWRGSk5ORVZWTTNsNk9URlFTRFpEWkVneVZqQWlMQ0o1SWpvaVgwdGplVXhxT1haWFRYQjBibTFMZEcwME5rZHhSSG80ZDJZM05FazFURXRuY213eVIzcElNMjVUUlNKOSIsIm5iZiI6MTY4NTQ0ODAwMH0.GpNndHFkLQlR7wtl4loorizB7jCXArv6YIPW5ckmFP92BXHd4o_bX13osah_3o2iqjN7SWjwex_L3COmB02ysg'
      ),
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
