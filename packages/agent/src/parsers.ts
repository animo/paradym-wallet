import type { AppAgent } from './agent'
import type { KeyDidCreateOptions } from '@aries-framework/core'

import { DidsApi, KeyType } from '@aries-framework/core'
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
  if (!data.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE)) return null

  const did = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: {
      keyType: KeyType.Ed25519,
    },
  })
  const keyInstance = didKeyToInstanceOfKey(did.didState.did!)

  return await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
    issuerUri: data,
    kid: `${did.didState.did!}#${keyInstance.fingerprint}`,
    verifyRevocationState: false,
  })

  // // Create a DID
  // const did = await agent.dids.create<KeyDidCreateOptions>({
  //   method: 'key',
  //   options: {
  //     keyType: KeyType.Ed25519,
  //   },
  // })

  // // Assert DIDDocument is valid
  // if (
  //   !did.didState.didDocument ||
  //   !did.didState.didDocument.authentication ||
  //   did.didState.didDocument.authentication.length === 0
  // ) {
  //   throw new Error(
  //     "Error creating did document, or did document has no 'authentication' verificationMethods"
  //   )
  // }

  // // Extract key identified (kid) for authentication verification method
  // const [verificationMethod] = did.didState.didDocument.authentication
  // const kid = typeof verificationMethod === 'string' ? verificationMethod : verificationMethod.id

  // return await agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({
  //   issuerUri: data,
  //   kid: kid,
  //   verifyRevocationState: false,
  // })
}

export const parseProofRequest = async ({ data }: { data: string }) => {
  if (!data.startsWith(QrTypes.OPENID)) return null

  return await Promise.resolve(data)
}
