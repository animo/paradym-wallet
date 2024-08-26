import { TypedArrayEncoder } from '@credo-ts/core'
import { EASYPID_WALLET_SEED_CREDENTIAL_RECORD_ID } from '@easypid/constants'
import { getWalletJsonStore, useWalletJsonRecord } from '@package/agent'

export const seedCredentialStorage = getWalletJsonStore<{ seedCredential: string }>(
  EASYPID_WALLET_SEED_CREDENTIAL_RECORD_ID
)

export interface SeedCredentialPidData {
  seedCredential: string
  iat: number
  pid_data: {
    place_of_birth: { locality: string }
    birthdate: string
    address: {
      street_address: string
      country: string
      locality: string
      postal_code: string
    }
    birth_family_name: string
    nationality: string
    given_name: string
    family_name: string
  }
}

export const useSeedCredential = () => {
  return useWalletJsonRecord<{ seedCredential: string }>(seedCredentialStorage.recordId)
}

export const useSeedCredentialPidData = (): {
  isLoading: boolean
  seedCredential: SeedCredentialPidData | undefined
} => {
  const { record, isLoading } = useSeedCredential()

  if (!record) {
    return {
      seedCredential: undefined,
      isLoading,
    }
  }

  const payload = record.seedCredential.split('.')[1]
  const parsedPayload = JSON.parse(TypedArrayEncoder.fromBase64(payload).toString()) as SeedCredentialPidData

  return {
    isLoading,
    seedCredential: parsedPayload,
  }
}
