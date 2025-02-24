import { registerCredentials, type RegisterCredentialsOptions } from '@animo-id/expo-digital-credentials-api'
import type { EitherAgent } from '../agent'
import { getCredentialForDisplay } from '../display'
import { sanitizeString } from '@package/utils'
import type { MdocNameSpaces } from '@credo-ts/core'

type CredentialItem = RegisterCredentialsOptions['credentials'][number]
type CredentialDisplayClaim = NonNullable<CredentialItem['display']['claims']>[number]

function mapMdocAttributes(namespaces: MdocNameSpaces) {
  return Object.fromEntries(
    Object.entries(namespaces).map(([namespace, values]) => [
      namespace,
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
            return [key, value]
          }

          if (value instanceof Date) {
            // TODO: handle DateOnly and Date
            return [key, value.toISOString()]
          }

          // For all other complex types we don't allow matching based on the value
          return [key, null]
        })
      ),
    ])
  )
}

function mapMdocAttributesToClaimDisplay(namespaces: MdocNameSpaces) {
  return Object.entries(namespaces).flatMap(([namespace, values]) =>
    Object.keys(values).map((key) => ({
      path: [namespace, key],
      // FIXME: we need to integrate with claim based mapping of names.
      // For that we first need to:
      //  - use the claims arrays with path syntax in our Wallet instead of the custom mappings
      //  - support oid4vci draft 15 claim syntax
      displayName: sanitizeString(key),
    }))
  )
}

function mapSdJwtAttributesToClaimDisplay(claims: object, path: string[] = []): CredentialDisplayClaim[] {
  return Object.entries(claims).flatMap(([claimName, value]) => {
    const nestedClaims =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mapSdJwtAttributesToClaimDisplay(value, [...path, claimName])
        : []

    return [
      {
        path: [...path, claimName],
        // FIXME: we need to integrate with claim based mapping of names.
        // For that we first need to:
        //  - use the claims arrays with path syntax in our Wallet instead of the custom mappings
        //  - support oid4vci draft 15 claim syntax
        displayName: sanitizeString(claimName),
      },
      ...nestedClaims,
    ]
  })
}

export async function registerCredentialsForDcApi(agent: EitherAgent) {
  const mdocRecords = await agent.mdoc.getAll()
  const sdJwtVcRecords = await agent.sdJwtVc.getAll()

  const mdocCredentials = mdocRecords.map((record): CredentialItem => {
    const mdoc = record.credential
    const { display } = getCredentialForDisplay(record)

    return {
      id: record.id,
      credential: {
        doctype: mdoc.docType,
        format: 'mso_mdoc',
        namespaces: mapMdocAttributes(mdoc.issuerSignedNamespaces),
      },
      display: {
        title: display.name,
        subtitle: `Issued by ${display.issuer.name}`,
        claims: mapMdocAttributesToClaimDisplay(mdoc.issuerSignedNamespaces),
      },
    } as const
  })

  const sdJwtCredentials = sdJwtVcRecords.map((record): CredentialItem => {
    const sdJwtVc = record.credential
    const { display } = getCredentialForDisplay(record)

    return {
      id: record.id,
      credential: {
        vct: record.getTags().vct,
        format: 'dc+sd-jwt',
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        claims: sdJwtVc.prettyClaims as any,
      },
      display: {
        title: display.name,
        subtitle: `Issued by ${display.issuer.name}`,
        claims: mapSdJwtAttributesToClaimDisplay(sdJwtVc.prettyClaims),
      },
    } as const
  })

  const credentials = [...sdJwtCredentials, ...mdocCredentials]
  agent.config.logger.debug('Registering credentials for Digital Credentials API', {
    credentials,
  })
  await registerCredentials({
    credentials,
  })
}
