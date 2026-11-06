import {
  type AgentContext,
  type EncodedX509Certificate,
  GenericRecord,
  GenericRecordsApi,
  JsonEncoder,
  JwsService,
  X509Api,
  X509Certificate,
} from '@credo-ts/core'
import { parseAccessCertificate, validateAccessCertificate } from '@owf/eudi-access-certificate'
import { getNotifiedTrustedEntities, LoTEProfile, validateLoTEProfile } from '@owf/eudi-lote'
import { parseCertificate } from '@owf/x509'
import type { TrustedEntity, TrustMechanismConfiguration } from './trustMechanism'

/**
 *
 * A list of trusted entities (ETSI TS 119 602) of providers of wallet-relying party access
 * certificates (ETSI TS 119 411-8) or registration certificates (ETSI TS 119 475), published by a
 * member state.
 *
 */
export type TrustedListConfiguration = {
  /** Where the list is published, as a compact JWS */
  url: string
  /**
   * The certificate the scheme operator signs the list with. Establish trust in it independently,
   * e.g. by comparing its fingerprint with the one the scheme operator publishes.
   */
  signerCertificate: EncodedX509Certificate
  /**
   * The country that publishes the list, e.g. `DE`, or `EU`. Its `SchemeTerritory` is either this
   * country or `EU`, as some countries publish under the EU territory of the profile. Shown for a
   * provider whose certificate has no country.
   */
  territory: string
  demo?: boolean
}

type TrustedList = {
  providers: Array<{ certificates: string[]; trustedEntity: TrustedEntity }>
  fetchedAt: number
  nextUpdate?: number
}

// The lists of providers of access certificates and of registration certificates (ETSI TS 119 475)
const trustedListTypes = {
  accessCertificate: {
    profile: LoTEProfile.EUWRPACProvidersList,
    serviceType: 'http://uri.etsi.org/19602/SvcType/WRPAC/Issuance',
  },
  registrationCertificate: {
    profile: LoTEProfile.EUWRPRCProvidersList,
    serviceType: 'http://uri.etsi.org/19602/SvcType/WRPRC/Issuance',
  },
}

type TrustedListType = keyof typeof trustedListTypes

// A list is fetched again once a day, or earlier when its next update is due
const MAX_TRUSTED_LIST_AGE_MS = 24 * 60 * 60 * 1000

const trustedLists = new Map<string, TrustedList>()
const pendingTrustedLists = new Map<string, Promise<TrustedList | undefined>>()

// Kept in the wallet store as well, so an app start doesn't have to fetch a list that is still current
const getTrustedListRecordId = (url: string) => `PARADYM_WALLET_TRUSTED_LIST_${url}`

const readStoredTrustedList = async (agentContext: AgentContext, url: string) => {
  const record = await agentContext.dependencyManager
    .resolve(GenericRecordsApi)
    .findById(getTrustedListRecordId(url))
    .catch(() => null)

  const trustedList = record?.content as TrustedList | undefined
  if (trustedList) trustedLists.set(url, trustedList)
  return trustedList
}

const storeTrustedList = async (agentContext: AgentContext, url: string, trustedList: TrustedList) => {
  const genericRecordsApi = agentContext.dependencyManager.resolve(GenericRecordsApi)
  const id = getTrustedListRecordId(url)
  const record = new GenericRecord({ id, content: trustedList as unknown as Record<string, unknown> })

  if (await genericRecordsApi.findById(id)) await genericRecordsApi.update(record)
  else await genericRecordsApi.save(record)
}

const getLocalizedValue = <T extends { lang: string }>(values: T[] | undefined) =>
  values?.find((value) => value.lang.startsWith('en')) ?? values?.[0]

const fetchTrustedList = async (
  agentContext: AgentContext,
  config: TrustedListConfiguration,
  type: TrustedListType
): Promise<TrustedList> => {
  const { profile, serviceType } = trustedListTypes[type]
  const response = await agentContext.config.agentDependencies.fetch(config.url)
  if (!response.ok) throw new Error(`Fetching the trusted list failed with status ${response.status}`)
  const jws = (await response.text()).trim()

  const { isValid } = await agentContext.dependencyManager.resolve(JwsService).verifyJws(agentContext, {
    jws,
    allowedJwsSignerMethods: ['x5c'],
    trustedCertificates: [config.signerCertificate],
  })
  if (!isValid) throw new Error('The signature of the trusted list is invalid')

  const result = validateLoTEProfile(JsonEncoder.fromBase64Url(jws.split('.')[1]), profile, {
    mode: 'compat',
    allowedTerritories: [config.territory, 'EU'],
  })
  if (!result.valid) {
    throw new Error(
      `The trusted list is not a valid ${profile}: ${result.issues.map((issue) => issue.message).join(', ')}`
    )
  }

  const information = result.lote.LoTE.ListAndSchemeInformation
  const operatorName = getLocalizedValue(information.SchemeOperatorName)?.value ?? config.territory

  return {
    providers: getNotifiedTrustedEntities(result.lote).flatMap((entity) => {
      const certificates = entity.TrustedEntityServices.filter(
        (service) => service.ServiceInformation.ServiceTypeIdentifier === serviceType
      ).flatMap(
        (service) => service.ServiceInformation.ServiceDigitalIdentity.X509Certificates?.map(({ val }) => val) ?? []
      )
      if (certificates.length === 0) return []

      const information = entity.TrustedEntityInformation
      const name = getLocalizedValue(information.TEName)?.value ?? operatorName
      const uri = information.TEInformationURI?.map(({ uriValue }) => uriValue).find((uri) =>
        uri.startsWith('https://')
      )

      return [{ certificates, trustedEntity: { entityId: name, organizationName: name, uri } }]
    }),
    fetchedAt: Date.now(),
    nextUpdate: information.NextUpdate ? Date.parse(information.NextUpdate) : undefined,
  }
}

/**
 *
 * The trusted list, from memory or the wallet store, and fetched when it is not stored yet or due for
 * an update. Only a list that was never loaded is waited for: a list loaded before is used while its
 * update is fetched, and stays in use when fetching fails, so a list that can't be reached for a while
 * doesn't make everyone untrusted.
 *
 */
export const getTrustedList = async (
  agentContext: AgentContext,
  config: TrustedListConfiguration,
  type: TrustedListType
) => {
  const loaded = trustedLists.get(config.url) ?? (await readStoredTrustedList(agentContext, config.url))
  const now = Date.now()
  const isDue =
    !loaded ||
    now - loaded.fetchedAt >= MAX_TRUSTED_LIST_AGE_MS ||
    (loaded.nextUpdate !== undefined && now >= loaded.nextUpdate)

  if (isDue && !pendingTrustedLists.has(config.url)) {
    pendingTrustedLists.set(
      config.url,
      fetchTrustedList(agentContext, config, type)
        .then(async (trustedList) => {
          trustedLists.set(config.url, trustedList)
          await storeTrustedList(agentContext, config.url, trustedList).catch((error) =>
            agentContext.config.logger.warn(`Could not store the trusted list at '${config.url}'`, { error })
          )
          return trustedList
        })
        .catch((error) => {
          agentContext.config.logger.warn(`Could not load the trusted list at '${config.url}'`, { error })
          return loaded
        })
        .finally(() => pendingTrustedLists.delete(config.url))
    )
  }

  return loaded ?? pendingTrustedLists.get(config.url)
}

/**
 *
 * Start loading the trusted lists of the `x509` trust mechanism, from the wallet store or by fetching
 * them, so the first request doesn't have to wait for them.
 *
 */
export const loadTrustedLists = (agentContext: AgentContext, trustMechanisms: TrustMechanismConfiguration[]) => {
  for (const trustMechanism of trustMechanisms) {
    if (!('trustMechanism' in trustMechanism) || trustMechanism.trustMechanism !== 'x509') continue
    for (const config of trustMechanism.accessCertificateTrustedLists ?? []) {
      void getTrustedList(agentContext, config, 'accessCertificate')
    }
    for (const config of trustMechanism.registrationCertificateTrustedLists ?? []) {
      void getTrustedList(agentContext, config, 'registrationCertificate')
    }
  }
}

/**
 *
 * Validate an access certificate chain against the providers on the trusted lists. Returns who
 * vouches for it — the provider that issued the access certificate — and the name of the
 * wallet-relying party from its access certificate, or `undefined` when the chain leads to no listed
 * provider.
 *
 * The chain is validated by the agent, revocation included, so a revoked access certificate never
 * resolves to a trusted party.
 *
 */
export const findTrustedListEntities = async (
  agentContext: AgentContext,
  trustedListConfigurations: TrustedListConfiguration[],
  certificateChain: Array<EncodedX509Certificate | X509Certificate>
): Promise<{ organizationName?: string; trustedEntities: TrustedEntity[] } | undefined> => {
  if (trustedListConfigurations.length === 0 || certificateChain.length === 0) return undefined

  const encodedChain = certificateChain.map((certificate) =>
    typeof certificate === 'string' ? certificate : certificate.toString('base64')
  )
  const loadedLists = await Promise.all(
    trustedListConfigurations.map((config) => getTrustedList(agentContext, config, 'accessCertificate'))
  )

  for (const [index, trustedList] of loadedLists.entries()) {
    if (!trustedList || trustedList.providers.length === 0) continue

    const chain = await agentContext.dependencyManager
      .resolve(X509Api)
      .validateCertificateChain({
        certificateChain: encodedChain,
        certificate: encodedChain[0],
        trustedCertificates: trustedList.providers.flatMap(({ certificates }) => certificates),
      })
      .catch(() => undefined)
    if (!chain) continue

    // The validated chain starts at the trusted certificate
    const provider = trustedList.providers.find(({ certificates }) =>
      certificates.some((certificate) => X509Certificate.fromEncodedCertificate(certificate).equal(chain[0]))
    )
    if (!provider) continue

    const accessCertificate = parseAccessCertificate(encodedChain[0])
    const { issues } = validateAccessCertificate(accessCertificate, { now: false })
    if (issues.length > 0) {
      agentContext.config.logger.warn('The access certificate does not follow ETSI TS 119 411-8', { issues })
    }

    // GEN-6.1.1-04: the common name is the trade or service name that the user recognises
    const { commonName, organizationName } = accessCertificate.certificate.subject

    // The country of the provider's certificate the chain leads to, as one list can have providers of
    // several countries. Some leave it out, and some write it in lower case.
    const providerCountry = parseCertificate(chain[0].rawCertificate).subject.countryName?.toUpperCase()

    return {
      organizationName: commonName ?? organizationName,
      // From the configuration rather than the stored list, so a stored list follows a changed configuration
      trustedEntities: [
        {
          ...provider.trustedEntity,
          demo: trustedListConfigurations[index].demo,
          territory: providerCountry ?? trustedListConfigurations[index].territory,
        },
      ],
    }
  }
}
