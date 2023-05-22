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

export const parseCredentialOffer = async ({ data }: { data: string }) => {
  if (!data.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE)) return null

  return await Promise.resolve(data)
}

export const parseProofRequest = async ({ data }: { data: string }) => {
  if (!data.startsWith(QrTypes.OPENID)) return null

  return await Promise.resolve(data)
}
