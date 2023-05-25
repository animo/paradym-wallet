import type { AppAgent } from './agent'

import { didKeyToInstanceOfKey } from '@aries-framework/core/build/modules/dids/helpers'

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

  const dids = await agent.dids.getCreatedDids({ method: 'key' })
  if (dids.length === 0)
    throw new Error('No key DID has been found on the agent. Make sure you have a DID registered.')

  const keyInstance = didKeyToInstanceOfKey(dids[0].did)

  const record = await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
    issuerUri: data,
    kid: `${dids[0].did}#${keyInstance.fingerprint}`,
    verifyRevocationState: false,
  })

  // const did = await agent.dids.create<KeyDidCreateOptions>({
  //   method: 'key',
  //   options: {
  //     keyType: KeyType.Ed25519,
  //   },
  // })
  // const keyInstance = didKeyToInstanceOfKey(did.didState.did as string)

  // const record = await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
  //   issuerUri: data,
  //   kid: `${did.didState.did as string}#${keyInstance.fingerprint}`,
  //   verifyRevocationState: false,
  // })

  if (!record) throw new Error('Error storing credential using pre authorized flow.')

  return record
}

// export const parseCredentialOffer = ({ data }: { data: string }) => {
//   try {
//     if (!data.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE))
//       throw new Error('URI does not start with OpenID issuance prefix.')

//     return Promise.resolve({
//       type: QrTypes.OPENID_INITIATE_ISSUANCE,
//       issuanceInitiation: IssuanceInitiation.fromURI(data),
//       uri: data,
//     })
//   } catch (error: unknown) {
//     return Promise.reject(error)
//   }
// }

export const parseProofRequest = async ({ data }: { data: string }) => {
  if (!data.startsWith(QrTypes.OPENID)) return null

  return await Promise.resolve(data)
}
