const BASE_URL = 'https://funke.animo.id/oid4vp'

export const TRUSTED_ENTITIES = [
  `${BASE_URL}/0193687b-0c27-7b82-a686-ff857dc6bbb3`,
  `${BASE_URL}/0193687f-20d8-720a-9139-ed939ba510fa`,
  `${BASE_URL}/019368ed-3787-7669-b7f4-8c012238e90d`,
  `${BASE_URL}/01936907-56a3-7007-a61f-44bff8b5d175`,
  `${BASE_URL}/01936903-8879-733f-8eaf-6f2fa862099c`,
] satisfies [string, ...string[]]

export type TrustedEntity = {
  entityId: string
  organizationName: string
  logoUri?: string
  uri?: string
}
