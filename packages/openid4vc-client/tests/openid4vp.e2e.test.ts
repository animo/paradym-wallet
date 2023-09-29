import type { KeyDidCreateOptions } from '@aries-framework/core'

import { AskarModule } from '@aries-framework/askar'
import {
  JwaSignatureAlgorithm,
  Agent,
  KeyType,
  TypedArrayEncoder,
  W3cCredentialRecord,
  DidKey,
} from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'

import { OpenId4VcClientModule, OpenId4VpClientService } from '../src'
import { OpenIdCredentialFormatProfile } from '../src/utils/claimFormatMapping'

const modules = {
  openId4VcClient: new OpenId4VcClientModule(),
  askar: new AskarModule({
    ariesAskar,
  }),
}

describe('OpenId4VcClient | OpenID4VP', () => {
  let agent: Agent<typeof modules>

  beforeEach(async () => {
    agent = new Agent({
      config: {
        label: 'OpenId4VcClient OpenID4VP Test',
        walletConfig: {
          id: 'openid4vc-client-openid4vp-test',
          key: 'openid4vc-client-openid4vp-test',
        },
      },
      dependencies: agentDependencies,
      modules,
    })

    await agent.initialize()
  })

  afterEach(async () => {
    await agent.shutdown()
    await agent.wallet.delete()
  })

  describe('Authorization Request', () => {
    it('[DRAFT 08]: Should successfully execute the pre-authorized flow using a did:key P256 subject and JWT credential', async () => {
      const openId4VpClientService = agent.dependencyManager.resolve(OpenId4VpClientService)
      const results = await openId4VpClientService.selectCredentialForProofRequest(agent.context, {
        authorizationRequest:
          'openid4vp://authorize?client_id=https://launchpad.mattrlabs.com/api/vp/callback&client_id_scheme=redirect_uri&response_uri=https://launchpad.mattrlabs.com/api/vp/callback&response_type=vp_token&response_mode=direct_post&presentation_definition_uri=https://launchpad.mattrlabs.com/api/vp/request?state=b5ktzmeknMKDh0aQ7wBy7A&nonce=cEtvqAkaQZqTR0RHOFvOHg&state=b5ktzmeknMKDh0aQ7wBy7A',
      })

      console.log(results)
    })
  })
})
