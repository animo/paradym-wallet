import type { AppAgent } from './agent'

import { DidKey } from '@aries-framework/core'

export enum QrTypes {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance',
  OPENID = 'openid',
}

export const isOpenIdCredentialOffer = (url: string) => {
  return url.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE)
}

export const isOpenIdProofRequest = (url: string) => {
  return url.startsWith(QrTypes.OPENID)
}

export const receiveCredentialFromOpenId4VciOffer = async ({
  agent,
  data,
}: {
  agent: AppAgent
  data: string
}) => {
  if (!data.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE))
    throw new Error('URI does not start with OpenID issuance prefix.')

  const [didRecord] = await agent.dids.getCreatedDids({ method: 'key' })
  if (!didRecord) {
    throw new Error('No key DID has been found on the agent. Make sure you have a DID registered.')
  }

  const didKey = DidKey.fromDid(didRecord.did)
  const kid = `${didKey.did}#${didKey.key.fingerprint}`
  const validationMethod = didKey.didDocument.dereferenceVerificationMethod(kid)

  const record = await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
    issuerUri: data,
    proofOfPossessionVerificationMethodResolver: () => validationMethod,
    verifyCredentialStatus: false,
  })

  if (!record) throw new Error('Error storing credential using pre authorized flow.')

  return record
}

export const parseProofRequest = async ({ data }: { data: string }) => {
  if (!data.startsWith(QrTypes.OPENID)) return null

  return await Promise.resolve(data)
}
