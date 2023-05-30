import type { AppAgent } from './agent'

import { DidKey } from '@aries-framework/core'
import { didKeyToInstanceOfKey } from '@aries-framework/core/build/modules/dids/helpers'
import { IssuanceInitiation } from '@sphereon/openid4vci-client'

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

export const parseCredentialOffer = async ({ agent, data }: { agent: AppAgent; data: string }) => {
  if (!data.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE))
    throw new Error('URI does not start with OpenID issuance prefix.')

  const [didRecord] = await agent.dids.getCreatedDids({ method: 'key' })
  if (!didRecord) {
    throw new Error('No key DID has been found on the agent. Make sure you have a DID registered.')
  }

  const didKey = DidKey.fromDid(didRecord.did)
  const record = await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
    issuerUri: data,
    kid: `${didKey.did}#${didKey.key.fingerprint}`,
    verifyRevocationState: false,
  })

  if (!record) throw new Error('Error storing credential using pre authorized flow.')

  return record
}

export const parseCredentialUri = ({ data }: { data: string }) => {
  try {
    if (!data.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE))
      throw new Error('URI does not start with OpenID issuance prefix.')

    return Promise.resolve({
      type: QrTypes.OPENID_INITIATE_ISSUANCE,
      issuanceInitiation: IssuanceInitiation.fromURI(data),
      uri: data,
    })
  } catch (error: unknown) {
    return Promise.reject(error)
  }
}

export const parseProofRequest = async ({ data }: { data: string }) => {
  if (!data.startsWith(QrTypes.OPENID)) return null

  return await Promise.resolve(data)
}
