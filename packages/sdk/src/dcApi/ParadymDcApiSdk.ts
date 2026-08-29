import type {
  AndroidDcApiRequest,
  DcApiRequest,
  IosDcApiRequest,
  IsoMdocProtocolRequest,
  Openid4vpProtocolRequest,
} from '@animo-id/expo-digital-credentials-api/request-handler'
import { AskarKeyManagementService, AskarModule, AskarStoreInvalidKeyError } from '@credo-ts/askar'
import { Agent, CredoError, Kms, type X509Certificate, X509Module } from '@credo-ts/core'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { agentDependencies, SecureEnvironmentKeyManagementService } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'
import { defaultWalletId, getTrustedX509Certificates, type ParadymWalletSdkSharedOptions } from '../config'
import { ParadymWalletAuthenticationInvalidPinError, ParadymWalletNoStoreError } from '../error'
import { type FormattedSubmission, getFormattedSubmission } from '../format/submission'
import { createLogger } from '../logging'
import { getSubmissionForMdocDocumentRequest } from '../proximity/getSubmissionForMdocDocumentRequest'
import {
  getWalletStoreDatabaseConfig,
  getWalletStoreId,
  getWalletStorePath,
  walletStoreExists,
} from '../storage/walletStore'
import type { TrustMechanism, TrustMechanismConfiguration } from '../trust/trustMechanism'
import {
  getVerifierForMdocReaderAuthentication,
  getVerifierForOpenId4VpRequest,
  type RequestVerifier,
} from '../trust/verifier'
import { getSubmissionForMdocDcApiRequest, orderMdocMatches, toDeviceRequest } from './submission'

export type ParadymDcApiAgent = Agent<ReturnType<typeof getModules>>

/**
 * The same configuration the app sets the full SDK up with, minus what only the app can use.
 *
 * `storePath` is not part of it: the request UI has to look for the store exactly where
 * {@link walletStoreExists} does, or it would provision an empty one next to the real one.
 * DIDComm is not part of it either — nothing here speaks it.
 *
 * Pass the app's own configuration object straight through, so trust is configured once:
 *
 * ```typescript
 * await ParadymDcApiSdk.initialize({ ...paradymWalletSdkOptions, walletKey })
 * ```
 */
export type ParadymDcApiSdkOptions = Omit<ParadymWalletSdkSharedOptions, 'storePath'> & {
  /**
   * The key the store was created with, from
   * {@link import('../secure/walletKey').getWalletKeyUsingPin} or its biometrics counterpart.
   */
  walletKey: string
}

export type DcApiReview = {
  /**
   * What the verifier asked for and what the wallet would answer it with, in the same shape the
   * app's share flow renders.
   */
  submission: FormattedSubmission

  /**
   * Who is asking, as far as the wallet could establish it.
   */
  verifier: RequestVerifier

  /**
   * How {@link verifier} was established.
   */
  trustMechanism: TrustMechanism

  /**
   * Answers the request. Everything platform- and protocol-specific was decided while building the
   * review, so the caller only has to call this once the user approved.
   */
  share: () => Promise<void>
}

/**
 * The wallet, reduced to what answering a digital credentials request needs.
 *
 * The credential request UI is bundled separately from the app — inside the identity document
 * provider extension on iOS, in the activity the credential picker launches on Android — so it
 * cannot use the full SDK, which pulls in didcomm, anoncreds, issuance and the app's UI stack. This
 * is an instance of the same wallet with none of that: askar storage, both key management backends,
 * and the two modules a request can be answered with.
 */
export class ParadymDcApiSdk {
  private constructor(
    public readonly agent: ParadymDcApiAgent,
    private readonly configuration: Pick<ParadymDcApiSdkOptions, 'openId4VcConfiguration' | 'trustMechanisms'>
  ) {}

  /** The trust mechanisms the wallet is configured with, the app's list unchanged. */
  public get trustMechanisms(): TrustMechanismConfiguration[] {
    return this.configuration.trustMechanisms ?? []
  }

  /** Whether OpenID4VP requests can be answered, following `openId4VcConfiguration`. */
  public get isOpenId4VcEnabled() {
    return this.configuration.openId4VcConfiguration !== false
  }

  /**
   * Open the wallet store and get an instance to answer a request with.
   *
   * @throws {ParadymWalletNoStoreError} when the wallet has never run on this device.
   * @throws {ParadymWalletAuthenticationInvalidPinError} when the key does not open the store.
   */
  public static async initialize(options: ParadymDcApiSdkOptions): Promise<ParadymDcApiSdk> {
    const storeId = getWalletStoreId(options.id ?? defaultWalletId)

    // Before the store is opened: Credo provisions a store it cannot find, so a wallet that has
    // never run would otherwise leave an empty one behind, keyed to whatever PIN was entered here
    // — and on iOS the app would then skip migrating its real store into the shared container,
    // because it would find one already there.
    if (!(await walletStoreExists(storeId))) {
      throw new ParadymWalletNoStoreError('Open the wallet app once before sharing from it.')
    }

    const agent = new Agent({
      config: { logger: createLogger(options.logging) },
      dependencies: agentDependencies,
      modules: getModules({ ...options, storeId }),
    })

    // Opening the store *is* the PIN check: the key it was provisioned with is derived from the PIN.
    try {
      await agent.initialize()
    } catch (error) {
      if (error instanceof CredoError && error.cause instanceof AskarStoreInvalidKeyError) {
        throw new ParadymWalletAuthenticationInvalidPinError()
      }
      throw error
    }

    return new ParadymDcApiSdk(agent, {
      openId4VcConfiguration: options.openId4VcConfiguration,
      trustMechanisms: options.trustMechanisms,
    })
  }

  /**
   * Work out who is asking, what they are asking for, and how it would be answered.
   *
   * Nothing is released to the verifier here — on iOS the raw request is not even available until
   * `approve()`, which is why the review is built from what the OS parsed instead.
   */
  public async reviewRequest(request: DcApiRequest): Promise<DcApiReview> {
    try {
      if (request.platform === 'ios') return await this.reviewIosRequest(request)

      const protocolRequest = request.requests[request.selectedRequestIndex]
      if (!protocolRequest) throw new Error('The request carries no protocol this wallet can answer')

      return protocolRequest.protocol === 'org-iso-mdoc'
        ? await this.reviewMdocRequest(request, protocolRequest)
        : await this.reviewOpenId4VpRequest(request, protocolRequest)
    } catch (error) {
      this.agent.config.logger.error('Failed to review the request', { error })
      throw error
    }
  }

  public shutdown() {
    return this.agent.shutdown()
  }

  /**
   * ISO 18013-7 Annex C, on Android. Credo parses the request and matches it against the wallet's
   * mdocs in one go, so both the review and the response come out of the same resolved request.
   */
  private async reviewMdocRequest(
    request: AndroidDcApiRequest,
    protocolRequest: IsoMdocProtocolRequest
  ): Promise<DcApiReview> {
    if (!request.origin) throw new Error('The request carries no origin, so the wallet cannot establish trust')
      
    const resolved = await this.agent.mdoc.resolveDcApiRequest({
      request: protocolRequest.data,
      // Must come from the OS, never from the request payload (ISO 18013-7 C.5).
      origin: request.origin,
    })

    // Decided here rather than in `share`, so what the user reviewed is exactly what is sent.
    const credentials = bestMatches(resolved)

    return {
      submission: getSubmissionForMdocDcApiRequest(resolved),
      // A request without an origin came from a native app calling for itself, which the calling
      // package is the only identity for.
      ...(await this.getMdocVerifier(
        resolved.docRequests.find((docRequest) => docRequest.readerAuth?.certificateChain.length)?.readerAuth
          ?.certificateChain,
        request.origin ?? request.callingPackage
      )),
      share: async () => {
        const { response } = await this.agent.mdoc.createDcApiResponse({
          resolvedRequest: resolved,
          credentials,
        })
        await request.respond({ protocol: 'org-iso-mdoc', data: { response } })
      },
    }
  }

  /**
   * OpenID4VP over the digital credentials API, on Android. Trust is established exactly the way
   * the app establishes it for a request that arrived over a link or a QR code.
   */
  private async reviewOpenId4VpRequest(
    request: AndroidDcApiRequest,
    protocolRequest: Openid4vpProtocolRequest
  ): Promise<DcApiReview> {
    if (!this.isOpenId4VcEnabled) {
      throw new Error(`The wallet is not configured for OpenID4VP, so it cannot answer '${protocolRequest.protocol}'`)
    }

    const authorizationRequest = JSON.parse(protocolRequest.data) as Record<string, unknown>
    const resolved = await this.agent.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest, {
      origin: request.origin,
    })

    if (!resolved.dcql) {
      throw new Error('Only DCQL requests are supported over the digital credentials API')
    }

    const credentials = this.agent.openid4vc.holder.selectCredentialsForDcqlRequest(resolved.dcql.queryResult)

    return {
      submission: getFormattedSubmission(resolved),
      ...(await getVerifierForOpenId4VpRequest({
        agentContext: this.agent.context,
        trustMechanisms: this.trustMechanisms,
        resolvedAuthorizationRequest: resolved,
      })),
      share: async () => {
        const { authorizationResponse } = await this.agent.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
          authorizationRequestPayload: resolved.authorizationRequestPayload,
          origin: request.origin,
          dcql: { credentials },
        })

        await request.respond({ protocol: protocolRequest.protocol, data: authorizationResponse })
      },
    }
  }

  /**
   * iOS holds the raw request back until the wallet commits, so the review is built from the
   * summary the OS parsed and the wallet's own mdocs — matching on document type and element
   * identifiers, which is what the OS matched on too. The real request is resolved inside `share`,
   * after `approve()`.
   */
  private async reviewIosRequest(request: IosDcApiRequest): Promise<DcApiReview> {
    const stored = await this.agent.mdoc.getAll()
    const canAnswer = (doctype: string) => stored.some((record) => record.firstCredential.docType === doctype)

    // Exactly one document request set answers a presentment request; the first one the wallet can
    // answer in full is used, which is also what the response below picks.
    const documentRequests = request.presentmentRequests.flatMap((presentmentRequest) => {
      const sets = presentmentRequest.documentRequestSets
      const satisfiable = sets.find((set) =>
        set.documentRequests.every((documentRequest) => canAnswer(documentRequest.doctype))
      )

      return (satisfiable ?? sets[0])?.documentRequests ?? []
    })

    const submission = await getSubmissionForMdocDocumentRequest({
      mdocApi: this.agent.mdoc,
      encodedDeviceRequest: toDeviceRequest(documentRequests),
    })

    // The credential the review showed for each document type, so the response cannot end up
    // disclosing a different one than the user approved.
    const reviewedRecordIds = new Map(
      submission.entries
        .filter((entry) => entry.isSatisfied)
        .map((entry) => [entry.inputDescriptorId, entry.credentials[0].credential.record.id])
    )

    return {
      submission,
      // The OS parses reader authentication out for us, so the verifier is known before the raw
      // request is released — the same trust the Android mdoc path establishes.
      ...(await this.getMdocVerifier(request.readerAuthentications[0]?.certificateChain, request.origin)),
      share: async () => {
        // The point of no return: iOS releases the raw request only once the wallet commits to
        // answering it.
        const [isoMdoc] = await request.approve()
        if (!isoMdoc) throw new Error('The request carries no org-iso-mdoc request')

        const resolved = await this.agent.mdoc.resolveDcApiRequest({
          request: isoMdoc.data,
          // Must come from the OS, never from the request payload (ISO 18013-7 C.5).
          origin: request.origin,
        })

        const credentials = resolved.docRequests.flatMap((docRequest) => {
          const reviewedRecordId = reviewedRecordIds.get(docRequest.docType)
          const match =
            docRequest.matches.find(({ record }) => record.id === reviewedRecordId) ??
            orderMdocMatches(docRequest.matches)[0]

          return match ? [{ docRequestIndex: docRequest.docRequestIndex, record: match.record }] : []
        })
        if (credentials.length === 0) throw new Error('No stored card matches the request')

        const { response } = await this.agent.mdoc.createDcApiResponse({
          resolvedRequest: resolved,
          credentials,
        })
        await request.respond({ protocol: 'org-iso-mdoc', data: { response } })
      },
    }
  }

  private getMdocVerifier(readerCertificateChain: Array<string | X509Certificate> | undefined, origin: string) {
    return getVerifierForMdocReaderAuthentication({
      agentContext: this.agent.context,
      trustMechanisms: this.trustMechanisms,
      readerCertificateChain,
      origin,
    })
  }
}

/**
 * askar storage, both key management backends, and the two modules a request can be answered with —
 * mdoc (registered by core) for ISO 18013-7 Annex C, and openid4vc for OpenID4VP. No didcomm, no
 * anoncreds, no issuance.
 *
 * The secure environment backend is required: PID mdocs bind their device key to the Secure
 * Enclave, and the response has to sign DeviceAuth with it. On iOS the provider extension reaches
 * the same keys as the app because the config plugin puts both targets in the same keychain access
 * group.
 */
function getModules({
  walletKey,
  storeId,
  openId4VcConfiguration,
  trustMechanisms,
}: ParadymDcApiSdkOptions & { storeId: string }) {
  return {
    askar: new AskarModule({
      enableKms: false,
      askar: NativeAskar.instance,
      store: {
        id: storeId,
        key: walletKey,
        keyDerivationMethod: 'raw' as const,
        ...getWalletStoreDatabaseConfig(getWalletStorePath(storeId)),
      },
    }),
    kms: new Kms.KeyManagementModule({
      backends: [new AskarKeyManagementService(), new SecureEnvironmentKeyManagementService()],
      defaultBackend: 'askar',
    }),
    openid4vc: new OpenId4VcModule({}),
    // The same roots and the same callback the app verifies with — configured once, as trust
    // mechanisms, and derived here exactly the way the full SDK derives them.
    x509: new X509Module({
      trustedCertificates: getTrustedX509Certificates(trustMechanisms) as undefined | [string, ...string[]],
      getTrustedCertificatesForVerification: openId4VcConfiguration
        ? openId4VcConfiguration.getTrustedCertificatesForVerification
        : undefined,
    }),
  }
}

/** The credential to answer each document request with, in the order the review showed them. */
function bestMatches(resolved: Awaited<ReturnType<ParadymDcApiAgent['mdoc']['resolveDcApiRequest']>>) {
  return resolved.docRequests.flatMap((docRequest) => {
    const [match] = orderMdocMatches(docRequest.matches)
    return match ? [{ docRequestIndex: docRequest.docRequestIndex, record: match.record }] : []
  })
}
