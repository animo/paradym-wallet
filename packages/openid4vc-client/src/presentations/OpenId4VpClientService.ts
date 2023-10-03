import type {
  AgentContext,
  W3cVerifiableCredential,
  W3cVerifiablePresentation,
} from '@aries-framework/core'
import type {
  DIDDocument,
  PresentationDefinitionWithLocation,
  SigningAlgo,
  URI,
  Verification,
  VerifiedAuthorizationRequest,
} from '@sphereon/did-auth-siop'
import type { PresentationDefinitionV1 } from '@sphereon/pex-models'
import type { W3CVerifiablePresentation } from '@sphereon/ssi-types'

import {
  AriesFrameworkError,
  Buffer,
  DidsApi,
  getJwkClassFromKeyType,
  getKeyFromVerificationMethod,
  injectable,
  TypedArrayEncoder,
  W3cJsonLdVerifiablePresentation,
} from '@aries-framework/core'
import { asArray } from '@aries-framework/core/build/utils'
import {
  CheckLinkedDomain,
  OP,
  ResponseMode,
  SupportedVersion,
  VerificationMode,
} from '@sphereon/did-auth-siop'

import { PresentationExchangeService } from './PresentationExchangeService'

/**
 * SIOPv2 Authorization Request with a single v1 presentation definition
 */
export type VerifiedAuthorizationRequestWithPresentationDefinition =
  VerifiedAuthorizationRequest & {
    presentationDefinitions: [
      PresentationDefinitionWithLocation & { definition: PresentationDefinitionV1 }
    ]
  }

function isVerifiedAuthorizationRequestWithPresentationDefinition(
  request: VerifiedAuthorizationRequest
): request is VerifiedAuthorizationRequestWithPresentationDefinition {
  return (
    request.presentationDefinitions !== undefined &&
    request.presentationDefinitions.length === 1 &&
    request.presentationDefinitions?.[0]?.definition !== undefined
  )
}

@injectable()
export class OpenId4VpClientService {
  public constructor(private presentationExchangeService: PresentationExchangeService) {}

  private getOp(agentContext: AgentContext) {
    const supportedDidMethods = this.getSupportedDidMethods(agentContext)

    const builder = OP.builder()
      .withResponseMode(ResponseMode.POST)
      .withSupportedVersions([SupportedVersion.SIOPv2_ID1])
      .withExpiresIn(300)
      .withCheckLinkedDomain(CheckLinkedDomain.NEVER)
      .withCustomResolver(this.getResolver(agentContext))

    // Add did methods
    for (const supportedDidMethod of supportedDidMethods) {
      builder.addDidMethod(supportedDidMethod)
    }

    const op = builder.build()

    return op
  }

  public async selectCredentialForProofRequest(
    agentContext: AgentContext,
    options: {
      authorizationRequest: string | URI
    }
  ) {
    const op = this.getOp(agentContext)

    const verification = {
      mode: VerificationMode.EXTERNAL,
      resolveOpts: {
        resolver: this.getResolver(agentContext),
        noUniversalResolverFallback: true,
      },
    } satisfies Verification

    // FIXME: this uses did-jwt for verification of the JWT, we can't verify it ourselves.
    const verifiedAuthorizationRequest = await op.verifyAuthorizationRequest(
      options.authorizationRequest,
      {
        verification,
      }
    )

    if (!isVerifiedAuthorizationRequestWithPresentationDefinition(verifiedAuthorizationRequest)) {
      throw new AriesFrameworkError(
        'Only SIOPv2 authorization request including a single presentation definition are supported'
      )
    }

    const selectResults = await this.presentationExchangeService.selectCredentialsForRequest(
      agentContext,
      verifiedAuthorizationRequest.presentationDefinitions[0].definition
    )

    return {
      verifiedAuthorizationRequest,
      selectResults,
    }
  }

  /**
   * Send a SIOPv2 authentication response to the relying party including a verifiable
   * presentation based on OpenID4VP.
   */
  public async shareProof(
    agentContext: AgentContext,
    options: {
      verifiedAuthorizationRequest: VerifiedAuthorizationRequestWithPresentationDefinition
      selectedCredentials: W3cVerifiableCredential[]
    }
  ) {
    const op = this.getOp(agentContext)

    const vp = await this.presentationExchangeService.createPresentation(agentContext, {
      selectedCredentials: options.selectedCredentials,
      presentationDefinition:
        options.verifiedAuthorizationRequest.presentationDefinitions[0].definition,
      includePresentationSubmissionInVp: false,
      // TODO: are there other properties we need to include?
      nonce:
        await options.verifiedAuthorizationRequest.authorizationRequest.getMergedProperty<string>(
          'nonce'
        ),
    })

    const verificationMethod = await this.getVerificationMethodFromVerifiablePresentation(
      agentContext,
      vp.verifiablePresentation
    )
    const key = getKeyFromVerificationMethod(verificationMethod)
    const alg = getJwkClassFromKeyType(key.keyType)?.supportedSignatureAlgorithms[0]
    if (!alg) {
      throw new AriesFrameworkError(`No supported algs for key type: ${key.keyType}`)
    }

    // FIXME: the spec requires us to use `path_nested`, which is not automatically
    // handled by the PEX library. We should probably do some version discovery here,
    // but that should then also be integrated into sphereon's pex library.
    // Response mode direct_post is new in Draft 18 and used by MATTR
    const responseMode =
      await options.verifiedAuthorizationRequest.authorizationRequest.getMergedProperty<string>(
        'response_mode'
      )

    if (responseMode === 'direct_post') {
      // We nest each descriptor with a path_nested if the path is not $
      // FIXME: this does not work with multiple presentation definitions and VPs
      vp.presentationSubmission.descriptor_map = vp.presentationSubmission.descriptor_map.map(
        (descriptor) => {
          if (descriptor.path === '$') return descriptor

          return {
            id: descriptor.id,
            path_nested: {
              ...descriptor,
              path: descriptor.path.replace('$.', '$.vp.'),
              format: 'jwt_vc_json',
            },
            path: '$',
            // NOTE: We only support JWT vps at the moment. Should be made dynamic at some point
            format: 'jwt_vp',
          }
        }
      )
    }

    const response = await op.createAuthorizationResponse(options.verifiedAuthorizationRequest, {
      issuer: verificationMethod.controller,
      presentationExchange: {
        verifiablePresentations: [vp.verifiablePresentation.encoded as W3CVerifiablePresentation],
        presentationSubmission: vp.presentationSubmission,
      },
      signature: {
        signature: async (data) => {
          const signature = await agentContext.wallet.sign({
            data: typeof data === 'string' ? TypedArrayEncoder.fromString(data) : Buffer.from(data),
            key,
          })

          return TypedArrayEncoder.toBase64URL(signature)
        },
        // FIXME: cast
        alg: alg as unknown as SigningAlgo,
        did: verificationMethod.controller,
        kid: verificationMethod.id,
      },
    })

    const responseToResponse = await op.submitAuthorizationResponse(response)

    if (!responseToResponse.ok) {
      throw new AriesFrameworkError(
        `Error submitting authorization response. ${await responseToResponse.text()}`
      )
    }
  }

  private getSupportedDidMethods(agentContext: AgentContext) {
    const didsApi = agentContext.dependencyManager.resolve(DidsApi)
    const supportedDidMethods: string[] = []

    for (const resolver of didsApi.config.resolvers) {
      supportedDidMethods.push(...resolver.supportedMethods)
    }

    return supportedDidMethods
  }

  private getResolver(agentContext: AgentContext) {
    return {
      resolve: async (didUrl: string) => {
        const didsApi = agentContext.dependencyManager.resolve(DidsApi)
        const result = await didsApi.resolve(didUrl)

        return {
          ...result,
          didDocument: result.didDocument?.toJSON() as DIDDocument,
        }
      },
    }
  }

  // TODO: we can do this in a simpler way, as we're now resolving it multiple times
  private async getVerificationMethodFromVerifiablePresentation(
    agentContext: AgentContext,
    verifiablePresentation: W3cVerifiablePresentation
  ) {
    const didsApi = agentContext.dependencyManager.resolve(DidsApi)

    let verificationMethod: string
    if (verifiablePresentation instanceof W3cJsonLdVerifiablePresentation) {
      const [firstProof] = asArray(verifiablePresentation.proof)

      if (!firstProof) {
        throw new AriesFrameworkError('Verifiable presentation does not contain a proof')
      }
      verificationMethod = firstProof.verificationMethod
    } else {
      // FIXME: cast
      verificationMethod = verifiablePresentation.jwt.header.kid as string
    }

    const didDocument = await didsApi.resolveDidDocument(verificationMethod)

    return didDocument.dereferenceKey(verificationMethod, ['authentication'])
  }
}
