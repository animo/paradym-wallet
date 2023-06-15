import type {
  GenerateAuthorizationUrlOptions,
  RequestCredentialOptions,
  ProofOfPossessionVerificationMethodResolver,
  SupportedCredentialFormats,
  ProofOfPossessionRequirements,
} from './OpenId4VcClientServiceOptions'
import type { OpenIdCredentialFormatProfile } from './utils'
import type {
  AgentContext,
  W3cVerifiableCredential,
  VerificationMethod,
  JwaSignatureAlgorithm,
  W3cCredentialRecord,
  W3cVerifyCredentialResult,
} from '@aries-framework/core'
import type {
  CredentialResponse,
  CredentialSupported,
  Jwt,
  OpenIDResponse,
} from '@sphereon/oid4vci-common'

import {
  ClaimFormat,
  getJwkClassFromJwaSignatureAlgorithm,
  W3cJwtVerifiableCredential,
  AriesFrameworkError,
  getKeyFromVerificationMethod,
  Hasher,
  inject,
  injectable,
  InjectionSymbols,
  JsonEncoder,
  JsonTransformer,
  TypedArrayEncoder,
  W3cJsonLdVerifiableCredential,
  getJwkFromKey,
  getSupportedVerificationMethodTypesFromKeyType,
  getJwkClassFromKeyType,
  parseDid,
  SignatureSuiteRegistry,
  JwsService,
  Logger,
  W3cCredentialService,
} from '@aries-framework/core'
import { W3cCredentialRepository } from '@aries-framework/core/build/modules/vc/repository'
import {
  CredentialRequestClientBuilder,
  OpenID4VCIClient,
  ProofOfPossessionBuilder,
} from '@sphereon/oid4vci-client'
import {
  getUniformFormat,
  OfferedCredentialType,
  AuthzFlowType,
  CodeChallengeMethod,
} from '@sphereon/oid4vci-common'
import { randomStringForEntropy } from '@stablelib/random'

import { supportedCredentialFormats, AuthFlowType } from './OpenId4VcClientServiceOptions'
import {
  setOpenId4VcCredentialMetadata,
  fromOpenIdCredentialFormatProfileToDifClaimFormat,
} from './utils'

const flowTypeMapping = {
  [AuthFlowType.AuthorizationCodeFlow]: AuthzFlowType.AUTHORIZATION_CODE_FLOW,
  [AuthFlowType.PreAuthorizedCodeFlow]: AuthzFlowType.PRE_AUTHORIZED_CODE_FLOW,
}

/**
 * @internal
 */
@injectable()
export class OpenId4VcClientService {
  private logger: Logger
  private w3cCredentialService: W3cCredentialService
  private w3cCredentialRepository: W3cCredentialRepository
  private jwsService: JwsService

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    w3cCredentialService: W3cCredentialService,
    w3cCredentialRepository: W3cCredentialRepository,
    jwsService: JwsService
  ) {
    this.w3cCredentialService = w3cCredentialService
    this.w3cCredentialRepository = w3cCredentialRepository
    this.jwsService = jwsService
    this.logger = logger
  }

  private generateCodeVerifier(): string {
    return randomStringForEntropy(256)
  }

  public async generateAuthorizationUrl(options: GenerateAuthorizationUrlOptions) {
    this.logger.debug('Generating authorization url')

    if (!options.scope || options.scope.length === 0) {
      throw new AriesFrameworkError(
        'Only scoped based authorization requests are supported at this time. Please provide at least one scope'
      )
    }

    const client = await OpenID4VCIClient.fromURI({
      uri: options.uri,
      flowType: AuthzFlowType.AUTHORIZATION_CODE_FLOW,
    })
    const codeVerifier = this.generateCodeVerifier()
    const codeVerifierSha256 = Hasher.hash(TypedArrayEncoder.fromString(codeVerifier), 'sha2-256')
    const base64Url = TypedArrayEncoder.toBase64URL(codeVerifierSha256)

    this.logger.debug('Converted code_verifier to code_challenge', {
      codeVerifier: codeVerifier,
      sha256: codeVerifierSha256.toString(),
      base64Url: base64Url,
    })

    const authorizationUrl = client.createAuthorizationRequestUrl({
      clientId: options.clientId,
      codeChallengeMethod: CodeChallengeMethod.SHA256,
      codeChallenge: base64Url,
      redirectUri: options.redirectUri,
      scope: options.scope?.join(' '),
    })

    return {
      authorizationUrl,
      codeVerifier,
    }
  }

  public async requestCredential(agentContext: AgentContext, options: RequestCredentialOptions) {
    const receivedCredentials: W3cCredentialRecord[] = []
    const supportedJwaSignatureAlgorithms = this.getSupportedJwaSignatureAlgorithms(agentContext)

    const allowedProofOfPossessionSignatureAlgorithms =
      options.allowedProofOfPossessionSignatureAlgorithms
        ? options.allowedProofOfPossessionSignatureAlgorithms.filter((algorithm) =>
            supportedJwaSignatureAlgorithms.includes(algorithm)
          )
        : supportedJwaSignatureAlgorithms

    // Take the allowed credential formats from the options or use the default
    const allowedCredentialFormats = options.allowedCredentialFormats ?? supportedCredentialFormats

    const flowType = flowTypeMapping[options.flowType]
    if (!flowType) {
      throw new AriesFrameworkError(
        `Unsupported flowType ${options.flowType}. Valid values are ${Object.values(
          AuthFlowType
        ).join(', ')}`
      )
    }

    const client = await OpenID4VCIClient.fromURI({
      uri: options.uri,
      flowType,
    })

    // acquire the access token
    // NOTE: only scope based flow is supported for authorized flow. However there's not clear mapping between
    // the scope property and which credential to request (this is out of scope of the spec), so it will still
    // just request all credentials that have been offered in the credential offer. We may need to add some extra
    // input properties that allows to define the credential type(s) to request.
    const accessToken =
      options.flowType === AuthFlowType.AuthorizationCodeFlow
        ? await client.acquireAccessToken({
            clientId: options.clientId,
            code: options.authorizationCode,
            codeVerifier: options.codeVerifier,
            redirectUri: options.redirectUri,
          })
        : await client.acquireAccessToken({})

    const serverMetadata = await client.retrieveServerMetadata()

    this.logger.info('Fetched server metadata', {
      issuer: serverMetadata.issuer,
      credentialEndpoint: serverMetadata.credential_endpoint,
      tokenEndpoint: serverMetadata.token_endpoint,
    })

    this.logger.debug('Full server metadata', serverMetadata)

    // Loop through all the credentialTypes in the credential offer
    for (const offeredCredential of client.getOfferedCredentialsWithMetadata()) {
      // TODO: support inline credential offers. Not clear to me how to determine the did method / alg, etc..
      if (offeredCredential.type === OfferedCredentialType.InlineCredentialOffer) {
        throw new AriesFrameworkError("Inline credential offers aren't supported")
      }

      const supportedCredentialMetadata = offeredCredential.credentialSupported

      // FIXME
      // If the credential id ends with the format, it is a v8 credential supported that has been
      // split into multiple entries (each entry can now only have one format). For now we continue
      // as assume there will be another entry with the correct format.
      if (supportedCredentialMetadata.id?.endsWith(`-${supportedCredentialMetadata.format}`)) {
        const format = getUniformFormat(supportedCredentialMetadata.format)
        if (!allowedCredentialFormats.includes(format as SupportedCredentialFormats)) {
          continue
        }
      }

      // Get all options for the credential request (such as which kid to use, the signature algorithm, etc)
      const { verificationMethod, signatureAlgorithm } = await this.getCredentialRequestOptions(
        agentContext,
        {
          allowedCredentialFormats,
          allowedProofOfPossessionSignatureAlgorithms,
          credentialMetadata: supportedCredentialMetadata,
          proofOfPossessionVerificationMethodResolver:
            options.proofOfPossessionVerificationMethodResolver,
        }
      )

      // Create the proof of possession
      const proofInput = await ProofOfPossessionBuilder.fromAccessTokenResponse({
        accessTokenResponse: accessToken,
        callbacks: {
          signCallback: this.signCallback(agentContext, verificationMethod),
        },
        version: client.version(),
      })
        .withEndpointMetadata(serverMetadata)
        .withAlg(signatureAlgorithm)
        .withClientId(verificationMethod.controller)
        .withKid(verificationMethod.id)
        .build()

      this.logger.debug('Generated JWS', proofInput)

      // Acquire the credential
      const credentialRequestClient = (
        await CredentialRequestClientBuilder.fromURI({
          uri: options.uri,
          metadata: serverMetadata,
        })
      )
        .withTokenFromResponse(accessToken)
        .build()

      const credentialResponse = await credentialRequestClient.acquireCredentialsUsingProof({
        proofInput,
        credentialSupported: supportedCredentialMetadata,
      })

      const storedCredential = await this.handleCredentialResponse(
        agentContext,
        credentialResponse,
        {
          verifyCredentialStatus: options.verifyCredentialStatus,
        }
      )

      // Set the OpenId4Vc credential metadata and update record
      setOpenId4VcCredentialMetadata(storedCredential, supportedCredentialMetadata, serverMetadata)
      await this.w3cCredentialRepository.update(agentContext, storedCredential)

      receivedCredentials.push(storedCredential)
    }

    return receivedCredentials
  }

  /**
   * Get the options for the credential request. Internally this will resolve the proof of possession
   * requirements, and based on that it will call the proofOfPossessionVerificationMethodResolver to
   * allow the caller to select the correct verification method based on the requirements for the proof
   * of possession.
   */
  private async getCredentialRequestOptions(
    agentContext: AgentContext,
    options: {
      proofOfPossessionVerificationMethodResolver: ProofOfPossessionVerificationMethodResolver
      allowedCredentialFormats: SupportedCredentialFormats[]
      allowedProofOfPossessionSignatureAlgorithms: JwaSignatureAlgorithm[]
      credentialMetadata: CredentialSupported
    }
  ) {
    const { signatureAlgorithm, supportedDidMethods, supportsAllDidMethods } =
      this.getProofOfPossessionRequirements(agentContext, {
        credentialMetadata: options.credentialMetadata,
        allowedCredentialFormats: options.allowedCredentialFormats,
        allowedProofOfPossessionSignatureAlgorithms:
          options.allowedProofOfPossessionSignatureAlgorithms,
      })

    const JwkClass = getJwkClassFromJwaSignatureAlgorithm(signatureAlgorithm)

    if (!JwkClass) {
      throw new AriesFrameworkError(
        `Could not determine JWK key type based on JWA signature algorithm '${signatureAlgorithm}'`
      )
    }

    const supportedVerificationMethods = getSupportedVerificationMethodTypesFromKeyType(
      JwkClass.keyType
    )

    const format = getUniformFormat(options.credentialMetadata.format)

    // Now we need to determine the did method and alg based on the cryptographic suite
    const verificationMethod = await options.proofOfPossessionVerificationMethodResolver({
      credentialFormat: format as SupportedCredentialFormats,
      proofOfPossessionSignatureAlgorithm: signatureAlgorithm,
      supportedVerificationMethods,
      keyType: JwkClass.keyType,
      supportedCredentialId: options.credentialMetadata.id as string,
      supportsAllDidMethods,
      supportedDidMethods,
    })

    // Make sure the verification method uses a supported did method
    if (
      !supportsAllDidMethods &&
      !supportedDidMethods.find((supportedDidMethod) =>
        verificationMethod.id.startsWith(supportedDidMethod)
      )
    ) {
      const { method } = parseDid(verificationMethod.id)
      const supportedDidMethodsString = supportedDidMethods.join(', ')
      throw new AriesFrameworkError(
        `Verification method uses did method '${method}', but issuer only supports '${supportedDidMethodsString}'`
      )
    }

    // Make sure the verification method uses a supported verification method type
    if (!supportedVerificationMethods.includes(verificationMethod.type)) {
      const supportedVerificationMethodsString = supportedVerificationMethods.join(', ')
      throw new AriesFrameworkError(
        `Verification method uses verification method type '${verificationMethod.type}', but only '${supportedVerificationMethodsString}' verification methods are supported for key type '${JwkClass.keyType}'`
      )
    }

    return { verificationMethod, signatureAlgorithm }
  }

  /**
   * Get the requirements for creating the proof of possession. Based on the allowed
   * credential formats, the allowed proof of possession signature algorithms, and the
   * credential type, this method will select the best credential format and signature
   * algorithm to use, based on the order of preference.
   */
  private getProofOfPossessionRequirements(
    agentContext: AgentContext,
    options: {
      allowedCredentialFormats: SupportedCredentialFormats[]
      credentialMetadata: CredentialSupported
      allowedProofOfPossessionSignatureAlgorithms: JwaSignatureAlgorithm[]
    }
  ): ProofOfPossessionRequirements {
    const { credentialMetadata, allowedCredentialFormats } = options

    // Get uniform format, so we don't have to deal with the different spec versions
    const format = getUniformFormat(credentialMetadata.format)

    if (!allowedCredentialFormats.includes(format as SupportedCredentialFormats)) {
      throw new AriesFrameworkError(
        `Issuer only supports format '${format}' for credential type '${
          credentialMetadata.id as string
        }', but the wallet only allows formats '${options.allowedCredentialFormats.join(', ')}'`
      )
    }

    const issuerSupportedCryptographicSuites =
      credentialMetadata.cryptographic_suites_supported ?? []
    const issuerSupportedBindingMethods: string[] =
      credentialMetadata.cryptographic_binding_methods_supported ??
      // FIXME: somehow the MATTR Launchpad returns binding_methods_supported instead of cryptographic_binding_methods_supported
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (credentialMetadata.binding_methods_supported as string[] | undefined) ??
      []

    // For each of the supported algs, find the key types, then find the proof types
    const signatureSuiteRegistry = agentContext.dependencyManager.resolve(SignatureSuiteRegistry)

    let potentialSignatureAlgorithm: JwaSignatureAlgorithm | undefined

    switch (format) {
      case 'jwt_vc_json':
      case 'jwt_vc_json-ld':
        potentialSignatureAlgorithm = options.allowedProofOfPossessionSignatureAlgorithms.find(
          (signatureAlgorithm) => issuerSupportedCryptographicSuites.includes(signatureAlgorithm)
        )
        break
      case 'ldp_vc':
        // We need to find it based on the JSON-LD proof type
        potentialSignatureAlgorithm = options.allowedProofOfPossessionSignatureAlgorithms.find(
          (signatureAlgorithm) => {
            const JwkClass = getJwkClassFromJwaSignatureAlgorithm(signatureAlgorithm)
            if (!JwkClass) return false

            // TODO: getByKeyType should return a list
            const matchingSuite = signatureSuiteRegistry.getByKeyType(JwkClass.keyType)
            if (!matchingSuite) return false

            return issuerSupportedCryptographicSuites.includes(matchingSuite.proofType)
          }
        )
        break
      default:
        throw new AriesFrameworkError(
          `Unsupported requested credential format '${credentialMetadata.format}' with id ${
            credentialMetadata.id as string
          }`
        )
    }

    const supportsAllDidMethods = issuerSupportedBindingMethods.includes('did')
    const supportedDidMethods = issuerSupportedBindingMethods.filter((method) =>
      method.startsWith('did:')
    )

    if (!potentialSignatureAlgorithm) {
      throw new AriesFrameworkError(
        `Could not establish signature algorithm for id ${credentialMetadata.id as string}`
      )
    }

    return {
      signatureAlgorithm: potentialSignatureAlgorithm,
      supportedDidMethods,
      supportsAllDidMethods,
    }
  }

  /**
   * Returns the JWA Signature Algorithms that are supported by the wallet.
   *
   * This is an approximation based on the supported key types of the wallet.
   * This is not 100% correct as a supporting a key type does not mean you support
   * all the algorithms for that key type. However, this needs refactoring of the wallet
   * that is planned for the 0.5.0 release.
   */
  private getSupportedJwaSignatureAlgorithms(agentContext: AgentContext): JwaSignatureAlgorithm[] {
    const supportedKeyTypes = agentContext.wallet.supportedKeyTypes

    // Extract the supported JWS algs based on the key types the wallet support.
    const supportedJwaSignatureAlgorithms = supportedKeyTypes
      // Map the supported key types to the supported JWK class
      .map(getJwkClassFromKeyType)
      // Filter out the undefined values
      .filter((jwkClass): jwkClass is Exclude<typeof jwkClass, undefined> => jwkClass !== undefined)
      // Extract the supported JWA signature algorithms from the JWK class
      .map((jwkClass) => jwkClass.supportedSignatureAlgorithms)
      // Flatten the array of arrays
      .reduce((allAlgorithms, algorithms) => [...allAlgorithms, ...algorithms], [])

    return supportedJwaSignatureAlgorithms
  }

  private async handleCredentialResponse(
    agentContext: AgentContext,
    credentialResponse: OpenIDResponse<CredentialResponse>,
    options: { verifyCredentialStatus: boolean }
  ) {
    this.logger.debug('Credential request response', credentialResponse)

    if (!credentialResponse.successBody) {
      throw new AriesFrameworkError('Did not receive a successful credential response')
    }

    const format = getUniformFormat(credentialResponse.successBody.format)
    const difClaimFormat = fromOpenIdCredentialFormatProfileToDifClaimFormat(
      format as OpenIdCredentialFormatProfile
    )

    let credential: W3cVerifiableCredential
    let result: W3cVerifyCredentialResult
    if (difClaimFormat === ClaimFormat.LdpVc) {
      credential = JsonTransformer.fromJSON(
        credentialResponse.successBody.credential,
        W3cJsonLdVerifiableCredential
      )
      result = await this.w3cCredentialService.verifyCredential(agentContext, {
        credential,
        verifyCredentialStatus: options.verifyCredentialStatus,
      })
    } else if (difClaimFormat === ClaimFormat.JwtVc) {
      credential = W3cJwtVerifiableCredential.fromSerializedJwt(
        credentialResponse.successBody.credential as string
      )
      result = await this.w3cCredentialService.verifyCredential(agentContext, {
        credential,
        verifyCredentialStatus: options.verifyCredentialStatus,
      })
    } else {
      throw new AriesFrameworkError(
        `Unsupported credential format ${credentialResponse.successBody.format}`
      )
    }

    // if (!result || !result.isValid) {
    //   throw new AriesFrameworkError(
    //     `Failed to validate credential, error = ${result.error?.message ?? 'Unknown'}`
    //   )
    // }

    const storedCredential = await this.w3cCredentialService.storeCredential(agentContext, {
      credential,
    })

    this.logger.info(`Stored credential with id: ${storedCredential.id}`)
    this.logger.debug('Full credential', storedCredential)

    return storedCredential
  }

  private signCallback(agentContext: AgentContext, verificationMethod: VerificationMethod) {
    return async (jwt: Jwt, kid?: string) => {
      if (!jwt.header) {
        throw new AriesFrameworkError('No header present on JWT')
      }

      if (!jwt.payload) {
        throw new AriesFrameworkError('No payload present on JWT')
      }

      if (!kid) {
        throw new AriesFrameworkError('No KID is present in the callback')
      }

      // We have determined the verification method before and already passed that when creating the callback,
      // however we just want to make sure that the kid matches the verification method id
      if (verificationMethod.id !== kid) {
        throw new AriesFrameworkError(
          `kid ${kid} does not match verification method id ${verificationMethod.id}`
        )
      }

      const key = getKeyFromVerificationMethod(verificationMethod)
      const jwk = getJwkFromKey(key)

      const payload = JsonEncoder.toBuffer(jwt.payload)
      if (!jwk.supportsSignatureAlgorithm(jwt.header.alg)) {
        throw new AriesFrameworkError(
          `kid ${kid} refers to a key of type '${jwk.keyType}', which does not support the JWS signature alg '${jwt.header.alg}'`
        )
      }

      // We don't support these properties, remove them, so we can pass all other header properties to the JWS service
      if (jwt.header.x5c || jwt.header.jwk)
        throw new AriesFrameworkError('x5c and jwk are not supported')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { x5c: _x5c, jwk: _jwk, ...supportedHeaderOptions } = jwt.header

      const jws = await this.jwsService.createJwsCompact(agentContext, {
        key,
        payload,
        protectedHeaderOptions: supportedHeaderOptions,
      })

      return jws
    }
  }
}
