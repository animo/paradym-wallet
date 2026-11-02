import { type CustomTypeMetadataResolver, IntegrityVerifier, TypedArrayEncoder } from '@credo-ts/core'

/**
 * Where the SD-JWT VC type metadata of a `vct` is fetched from instead of the `vct` itself, by `vct`.
 *
 * For a type whose publisher doesn't serve its type metadata yet. A type that extends it can only be
 * resolved with it, so without a location its whole `extends` chain fails to resolve.
 */
export type SdJwtVcTypeMetadataLocations = Record<string, string>

let typeMetadataLocations: SdJwtVcTypeMetadataLocations = {}

export function setSdJwtVcTypeMetadataLocations(locations: SdJwtVcTypeMetadataLocations | undefined): void {
  typeMetadataLocations = locations ?? {}
}

const fetchTimeoutMs = 10_000

// The longest chain followed, so a type that extends itself in a loop ends.
const maxChainLength = 10

async function fetchBytes(url: string): Promise<Uint8Array | undefined> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs)
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : undefined
  } catch {
    return undefined
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * The type metadata of a `vct`, from its location if it has one. `undefined` when it can't be
 * fetched or read. Throws when it doesn't match `integrity`.
 */
async function fetchTypeMetadata(vct: string, integrity?: string): Promise<Record<string, unknown> | undefined> {
  const url = typeMetadataLocations[vct] ?? vct
  if (!url.startsWith('https://')) return undefined

  const bytes = await fetchBytes(url)
  if (!bytes) return undefined
  if (integrity) IntegrityVerifier.verifyIntegrity(bytes, integrity)

  try {
    return JSON.parse(TypedArrayEncoder.toUtf8String(bytes))
  } catch {
    return undefined
  }
}

/** Resolves a `vct` that has a location from there, and any other the way Credo does. */
export const resolveSdJwtVcTypeMetadata: CustomTypeMetadataResolver = async (vct, integrity, options) => {
  const { throwErrorOnFetchError, throwErrorOnUnsupportedVctValue, defaultResolver } = options
  if (!typeMetadataLocations[vct]) return defaultResolver({ throwErrorOnFetchError, throwErrorOnUnsupportedVctValue })

  const typeMetadata = await fetchTypeMetadata(vct, integrity)
  if (!typeMetadata && throwErrorOnFetchError !== false) {
    throw new Error(`Unable to fetch the type metadata of vct '${vct}' from '${typeMetadataLocations[vct]}'`)
  }
  return typeMetadata
}

/**
 * A `vct` and every type it extends, following the `extends` chain of its type metadata.
 *
 * For deciding on a credential by its type before there is a credential, as when choosing its key.
 * A received credential has its chain in `typeMetadataChain` already. A type whose metadata can't
 * be fetched ends the chain, so this may return only `vct`.
 */
export async function resolveSdJwtVcTypes(vct: string): Promise<string[]> {
  const types = [vct]

  let typeMetadata = await fetchTypeMetadata(vct)
  while (typeof typeMetadata?.extends === 'string' && !types.includes(typeMetadata.extends)) {
    if (types.length >= maxChainLength) break

    types.push(typeMetadata.extends)
    const integrity = typeMetadata['extends#integrity']
    typeMetadata = await fetchTypeMetadata(typeMetadata.extends, typeof integrity === 'string' ? integrity : undefined)
  }

  return types
}
