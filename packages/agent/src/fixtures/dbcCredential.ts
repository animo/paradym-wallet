import type { AppAgent } from '../agent'
import type { JwkDidCreateOptions } from '@aries-framework/core'

import { KeyType, TypedArrayEncoder, W3cJwtVerifiableCredential } from '@aries-framework/core'

export async function importDbcCredentialWithDid(agent: AppAgent) {
  const dbcCredenitalSubjectDid =
    'did:jwk:eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IjVzWU9RVWZ5S0NfeWJFckJoLWdDQWJSWTdhNzhVd2JLTGdPbG11UWJFeDAiLCJ5IjoibjdUVnlIVGR4SFl4MlBnX2JPTkRaMU5jRDYzcUdscXpWSUxIRUhQOUNSRSJ9'
  const dbcCredentialSubjectDidSeed = TypedArrayEncoder.fromString(
    '1234567890123456789012345678901234567890123456789012345678901234'
  )

  const hasDbcCredentialSubjectDid =
    (await agent.dids.getCreatedDids({ did: dbcCredenitalSubjectDid })).length !== 0

  if (!hasDbcCredentialSubjectDid) {
    await agent.dids.create<JwkDidCreateOptions>({
      method: 'jwk',
      options: {
        keyType: KeyType.P256,
      },
      secret: {
        seed: dbcCredentialSubjectDidSeed,
      },
    })
  }

  // Check if dbc credential is already in the wallet
  const [dbcCredential] = await agent.w3cCredentials.findCredentialRecordsByQuery({
    subjectIds: [
      'did:jwk:eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IjVzWU9RVWZ5S0NfeWJFckJoLWdDQWJSWTdhNzhVd2JLTGdPbG11UWJFeDAiLCJ5IjoibjdUVnlIVGR4SFl4MlBnX2JPTkRaMU5jRDYzcUdscXpWSUxIRUhQOUNSRSJ9',
    ],
  })

  if (!dbcCredential) {
    await agent.w3cCredentials.storeCredential({
      credential: W3cJwtVerifiableCredential.fromSerializedJwt(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6ImRpZDprZXk6ekRuYWVUVTE0b2dyNXNZdUVDSmRnQXBkUDVyYml5bWt4RHBWdHh4U1NrZG15VVVwbyN6RG5hZVRVMTRvZ3I1c1l1RUNKZGdBcGRQNXJiaXlta3hEcFZ0eHhTU2tkbXlVVXBvIn0.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiREJDQ29uZmVyZW5jZUF0dGVuZGVlIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImZpcnN0TmFtZSI6IkphbiIsImxhc3ROYW1lIjoiUmlldHZlbGQiLCJlbWFpbCI6ImphbkBhbmltby5pZCIsImV2ZW50Ijp7Im5hbWUiOiJEQkMgQ29uZmVyZW5jZSAyMDIzIiwiZGF0ZSI6IjIwMjMtMDYtMjYifX19LCJpc3MiOiJkaWQ6a2V5OnpEbmFlVFUxNG9ncjVzWXVFQ0pkZ0FwZFA1cmJpeW1reERwVnR4eFNTa2RteVVVcG8iLCJzdWIiOiJkaWQ6andrOmV5SnJkSGtpT2lKRlF5SXNJbU55ZGlJNklsQXRNalUySWl3aWVDSTZJalZ6V1U5UlZXWjVTME5mZVdKRmNrSm9MV2REUVdKU1dUZGhOemhWZDJKTFRHZFBiRzExVVdKRmVEQWlMQ0o1SWpvaWJqZFVWbmxJVkdSNFNGbDRNbEJuWDJKUFRrUmFNVTVqUkRZemNVZHNjWHBXU1V4SVJVaFFPVU5TUlNKOSIsIm5iZiI6MTY4NTQ0ODAwMH0.dk0fAuGr_1Vk7slo6alxGOpjFHARN0iQHMJnL5qyhWROJnO4Oxx67UePATs7YPRmGxWYKj8hAiViilLjWII-ag'
      ),
    })
  }
}
