import { EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID } from '@easypid/constants'
import { aes256Gcm } from '@package/agent'

export const easyPidAes256Gcm = aes256Gcm(EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID)
