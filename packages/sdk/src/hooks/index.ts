import { useSecureUnlock } from '@package/secure-store/secureUnlock'
import { useActivities } from './useActivities'
import { useActivityById } from './useActivityById'
import { useCredentialByCategory } from './useCredentialByCategory'
import { useCredentialById } from './useCredentialById'
import { useCredentials } from './useCredentials'
import { useDidCommConnectionActions } from './useDidCommConnectionActions'
import { useDidCommCredentialActions } from './useDidCommCredentialActions'
import { useDidCommMediatorSetup } from './useDidCommMediatorSetup'
import { useDidCommPresentationActions } from './useDidCommPresentationActions'
import { useDidCommAgent } from './useDidcommAgent'
import { useHasInboxNotifications } from './useHasInboxNotifications'
import { useInboxNotifications } from './useInboxNotifications'
import { useOpenId4VcAgent } from './useOpenId4VcAgent'
import { useParadym } from './useParadym'

export {
  useParadym,
  useSecureUnlock,
  useCredentials,
  useCredentialById,
  useCredentialByCategory,
  useActivities,
  useActivityById,
  // TODO: these are quite different than the openid4vc way
  //       do we want to keep it like this or make them more consistent?
  useDidCommConnectionActions,
  useDidCommCredentialActions,
  useDidCommPresentationActions,
  useOpenId4VcAgent,
  useDidCommAgent,
  useInboxNotifications,
  useHasInboxNotifications,
  useDidCommMediatorSetup,
}

export type * from './useActivities'
export type * from './useActivityById'
export type * from './useCredentialByCategory'
export type * from './useCredentialById'
export type * from './useCredentialRecordById'
export type * from './useCredentialRecords'
export type * from './useCredentials'
export type * from './useDidCommConnectionActions'
export type * from './useDidCommCredentialActions'
export type * from './useDidCommMediatorSetup'
export type * from './useDidCommMessagePickup'
export type * from './useDidCommPresentationActions'
export type * from './useDidcommAgent'
export type * from './useInboxNotifications'
export type * from './useLogger'
export type * from './useOpenId4VcAgent'
export type * from './usePreFetchInboxDisplayMetadata'
