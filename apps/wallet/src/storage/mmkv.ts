import { getSharedMmkv } from '@paradym/wallet-sdk/storage/sharedMmkv'

// Deep import on purpose: the credential request UI reads this too, and the SDK's root entry pulls
// in didcomm, anoncreds and the app's UI stack — none of which its bundle links.
export const mmkv = getSharedMmkv()
